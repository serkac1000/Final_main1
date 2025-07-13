let model, webcam, ctx, labelContainer, maxPredictions;
const poseImages = new Map();
let currentPoseImage = null;
let currentPoseIndex = 0;
let poseHoldTimer = 3;
let lastPoseTime = 0;
let isTransitioning = false;
let isRecognitionRunning = false;
let confidenceScore = 0;
let activePoses = [];

// Define poses to match your 2-class model
const poses = [
    { name: "Поза горы", image: "pose1.jpg" },
    { name: "Поза дерева", image: "pose2.jpg" },
    { name: "Воин I", image: "pose3.jpg" },
    { name: "Воин II", image: "pose4.jpg" },
    { name: "Поза треугольника", image: "pose5.jpg" },
    { name: "Поза ребенка", image: "pose6.jpg" },
    { name: "Собака мордой вниз", image: "pose7.jpg" }
];

// Pose cycle for alternating between poses
let poseSequence = []; // Will be populated with active poses
let sequenceIndex = 0;

// Local model file storage
let localModelFiles = {
    modelJson: null,
    metadataJson: null,
    weightsBin: null
};

// Settings management
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('yogaAppSettings') || '{}');
    const defaultSettings = {
        audioEnabled: true,
        recognitionDelay: 3,
        accuracyThreshold: 0.5,
        activePoses: [true, true, true, true, true, true, true],
        poseNames: poses.map(pose => pose.name) // Initialize with default pose names
    };
    return { ...defaultSettings, ...settings };
}

function saveSettings(settings) {
    localStorage.setItem('yogaAppSettings', JSON.stringify(settings));
}

// IndexedDB functions for storing large files (weights.bin and images)
function openWeightsDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('YogaModelData', 2);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('weights')) {
                db.createObjectStore('weights');
            }
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
    });
}

async function saveWeightsToDB(weightsData) {
    try {
        const db = await openWeightsDB();
        const transaction = db.transaction(['weights'], 'readwrite');
        const store = transaction.objectStore('weights');

        await new Promise((resolve, reject) => {
            const request = store.put(weightsData, 'weights.bin');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        console.log('Weights.bin saved to IndexedDB successfully');
        return true;
    } catch (error) {
        console.error('Failed to save weights to IndexedDB:', error);
        return false;
    }
}

async function loadWeightsFromDB() {
    try {
        const db = await openWeightsDB();
        const transaction = db.transaction(['weights'], 'readonly');
        const store = transaction.objectStore('weights');

        return new Promise((resolve, reject) => {
            const request = store.get('weights.bin');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                if (request.result) {
                    console.log('Weights.bin loaded from IndexedDB');
                    resolve(request.result);
                } else {
                    resolve(null);
                }
            };
        });
    } catch (error) {
        console.error('Failed to load weights from IndexedDB:', error);
        return null;
    }
}

// Image storage functions using IndexedDB
async function saveImageToDB(imageData, poseIndex) {
    try {
        const db = await openWeightsDB();
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');

        await new Promise((resolve, reject) => {
            const request = store.put(imageData, `pose-${poseIndex}`);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        console.log(`Pose ${poseIndex} image saved to IndexedDB successfully`);
        return true;
    } catch (error) {
        console.error(`Failed to save pose ${poseIndex} image to IndexedDB:`, error);
        return false;
    }
}

async function loadImageFromDB(poseIndex) {
    try {
        const db = await openWeightsDB();
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');

        return new Promise((resolve, reject) => {
            const request = store.get(`pose-${poseIndex}`);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                if (request.result) {
                    console.log(`Pose ${poseIndex} image loaded from IndexedDB`);
                    resolve(request.result);
                } else {
                    resolve(null);
                }
            };
        });
    } catch (error) {
        console.error(`Failed to load pose ${poseIndex} image from IndexedDB:`, error);
        return null;
    }
}

// Compress image to reduce storage size
function compressImage(file, maxWidth = 300, quality = 0.6) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

            // Check if compressed image is still too large (over 500KB)
            const imageSizeKB = (compressedDataUrl.length * 0.75) / 1024;
            if (imageSizeKB > 500) {
                // Further compress if still too large
                const furtherCompressed = canvas.toDataURL('image/jpeg', 0.4);
                resolve(furtherCompressed);
            } else {
                resolve(compressedDataUrl);
            }
        };

        img.src = URL.createObjectURL(file);
    });
}

async function saveLocalModelFiles() {
    try {
        if (localModelFiles.modelJson) {
            localStorage.setItem('localModelJson', JSON.stringify(localModelFiles.modelJson));
        }
        if (localModelFiles.metadataJson) {
            localStorage.setItem('localMetadataJson', JSON.stringify(localModelFiles.metadataJson));
        }

        // Save weights.bin to IndexedDB for large file storage
        if (localModelFiles.weightsBin) {
            const saved = await saveWeightsToDB(localModelFiles.weightsBin);
            if (saved) {
                console.log('Model JSON, metadata saved to localStorage, weights saved to IndexedDB');
            } else {
                console.log('Model JSON and metadata saved to localStorage, but weights failed to save');
            }
        } else {
            console.log('Model JSON and metadata saved to localStorage');
        }
    } catch (error) {
        console.warn('Could not save model files:', error);
    }
}

async function loadLocalModelFiles() {
    try {
        const modelJson = localStorage.getItem('localModelJson');
        const metadataJson = localStorage.getItem('localMetadataJson');

        if (modelJson) {
            localModelFiles.modelJson = JSON.parse(modelJson);
            const modelLabel = document.getElementById('model-json')?.nextElementSibling;
            if (modelLabel) {
                modelLabel.classList.add('file-loaded');
                modelLabel.textContent = '[OK] model.json (saved)';
            }
        }
        if (metadataJson) {
            localModelFiles.metadataJson = JSON.parse(metadataJson);
            const metadataLabel = document.getElementById('metadata-json')?.nextElementSibling;
            if (metadataLabel) {
                metadataLabel.classList.add('file-loaded');
                metadataLabel.textContent = '[OK] metadata.json (saved)';
            }
        }

        // Load weights.bin from IndexedDB
        const weightsData = await loadWeightsFromDB();
        if (weightsData) {
            localModelFiles.weightsBin = weightsData;
            const weightsLabel = document.getElementById('weights-bin')?.nextElementSibling;
            if (weightsLabel) {
                weightsLabel.classList.add('file-loaded');
                weightsLabel.textContent = '[OK] weights.bin (saved)';
            }
            console.log('All local model files loaded successfully from storage');
        }

        // Update class counter after loading files
        updateModelClassCounter();
    } catch (error) {
        console.error('Error loading saved model files:', error);
    }
}

function savePoseSelection() {
    const settings = loadSettings();
    settings.activePoses = [];
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`pose-${i + 1}-enabled`);
        settings.activePoses[i] = checkbox ? checkbox.checked : false;
    }
    saveSettings(settings);
}

function saveAllData() {
    // Save current settings
    const settings = {
        audioEnabled: document.getElementById('audio-enabled').checked,
        recognitionDelay: parseInt(document.getElementById('recognition-delay').value),
        accuracyThreshold: parseFloat(document.getElementById('accuracy-threshold').value),
        activePoses: [],
        poseNames: []
    };

    // Save active poses state and custom names
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`pose-${i + 1}-enabled`);
        settings.activePoses[i] = checkbox ? checkbox.checked : false;

        // Save custom pose names from labels with cleaning
        const label = document.querySelector(`label[for="pose-${i + 1}-enabled"]`);
        if (label) {
            let cleanName = label.textContent
                .replace(/[\n\r\t]/g, ' ')      // Remove newlines, tabs
                .replace(/[^\w\s()]/g, ' ')     // Remove special characters except parentheses
                .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
                .replace(/^[^a-zA-Z]*/, '')     // Remove any non-letter characters at start
                .trim();

            // If name becomes empty or too short, use default
            if (cleanName.length < 3) {
                cleanName = poses[i].name;
            }

            settings.poseNames[i] = cleanName;
            label.textContent = cleanName; // Update display immediately
        }
    }

    saveSettings(settings);

    // Save local model files (except weights.bin due to size limits)
    saveLocalModelFiles();

    // Pose images are automatically saved to IndexedDB when uploaded

    alert('Настройки и данные модели успешно сохранены!\n\nВсе файлы, включая weights.bin и изображения поз, теперь сохранены локально и будут сохраняться между сессиями.');
}

async function clearMemory() {
    if (!confirm('⚠️ Очистить всю память?\n\nЭто навсегда удалит:\n• Сохраненные файлы модели (model.json, metadata.json, weights.bin)\n• Все загруженные изображения поз\n• Настройки приложения\n\nВы уверены, что хотите продолжить?')) {
        return;
    }

    try {
        // Clear localStorage
        localStorage.removeItem('localModelJson');
        localStorage.removeItem('localMetadataJson');
        localStorage.removeItem('yogaAppSettings');

        // Clear IndexedDB weights and images
        const db = await openWeightsDB();
        const transaction = db.transaction(['weights', 'images'], 'readwrite');

        // Clear weights store
        const weightsStore = transaction.objectStore('weights');
        await new Promise((resolve, reject) => {
            const request = weightsStore.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        // Clear images store
        const imagesStore = transaction.objectStore('images');
        await new Promise((resolve, reject) => {
            const request = imagesStore.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        // Reset in-memory model files
        localModelFiles = {
            modelJson: null,
            metadataJson: null,
            weightsBin: null
        };

        // Reset model variables
        model = null;
        maxPredictions = 0;

        // Clear pose images from memory
        poseImages.clear();

        // Reset UI file labels
        const fileLabels = ['model-json', 'metadata-json', 'weights-bin'];
        fileLabels.forEach(id => {
            const label = document.getElementById(id)?.nextElementSibling;
            if (label) {
                label.classList.remove('file-loaded');
                label.textContent = id.replace('-', '.').replace('bin', 'bin');
            }
        });

        // Reset pose images UI
        for (let i = 1; i <= 7; i++) {
            const preview = document.getElementById(`pose-${i}-preview`);
            const fileLabel = document.querySelector(`label[for="pose-${i}-image"]`);
            const poseItem = document.querySelector(`.pose-item:nth-child(${i})`);

            if (preview) {
                preview.style.display = 'none';
                preview.src = '';
            }
            if (fileLabel) {
                fileLabel.textContent = 'Choose File';
                fileLabel.style.background = '#e9ecef';
                fileLabel.style.color = '#495057';
            }
            if (poseItem) {
                poseItem.classList.remove('has-image');
            }
        }

        // Update class counter
        updateModelClassCounter();

        // Stop any running recognition
        if (isRecognitionRunning) {
            stopCameraRecognition();
            showSettingsPage();
        }

        alert('Память успешно очищена!\n\nВсе файлы модели, изображения поз и настройки были удалены. Теперь вы можете загрузить новую модель.');

        console.log('Memory cleared successfully - all local data removed');

    } catch (error) {
        console.error('Error clearing memory:', error);
        alert('Error clearing memory. Some data may not have been removed completely.');
    }
}

function getModelClassCount() {
    if (model && model.getTotalClasses) {
        return model.getTotalClasses();
    }
    if (localModelFiles.metadataJson && localModelFiles.metadataJson.labels) {
        return localModelFiles.metadataJson.labels.length;
    }
    return 0;
}

function updateModelClassCounter() {
    const counter = document.getElementById('model-class-counter');
    if (counter) {
        const classCount = getModelClassCount();
        counter.textContent = classCount;
        counter.className = classCount > 0 ? 'class-counter loaded' : 'class-counter empty';
    }
}

function getActivePoses() {
    activePoses = [];
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`pose-${i + 1}-enabled`);
        if (checkbox && checkbox.checked) {
            activePoses.push(i);
        }
    }
    // Update pose sequence with active poses
    poseSequence = [...activePoses];
    return activePoses;
}

// Initial setup functions
function showPoseImagesSection() {
    hideAllSetupSections();
    document.getElementById('pose-images-section').style.display = 'block';
}

function showDemoVideoSection() {
    hideAllSetupSections();
    document.getElementById('demo-video-section').style.display = 'block';
}

function showVideoLinksSection() {
    hideAllSetupSections();
    document.getElementById('video-links-section').style.display = 'block';
}

function hideAllSetupSections() {
    const sections = ['pose-images-section', 'demo-video-section', 'video-links-section'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

function backToFirstScreen() {
    // Check which page we're on and go back appropriately
    const settingsPage = document.getElementById('settings-page');
    const initialPage = document.getElementById('initial-page');

    if (settingsPage && settingsPage.classList.contains('active')) {
        // From settings page, go back to initial page
        settingsPage.classList.remove('active');
        initialPage.classList.add('active');
    } else {
        // From setup sections, just hide them
        hideAllSetupSections();
    }
}

function handlePoseImageUpload(event, poseIndex) {
    const file = event.target.files[0];
    const preview = document.getElementById(`pose-${poseIndex}-preview`);
    const icon = document.getElementById(`pose-${poseIndex}-icon`);
    const nameElement = document.getElementById(`pose-${poseIndex}-name`);

    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите действительный файл изображения');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';

            // Show file icon and name
            icon.style.display = 'inline';
            nameElement.textContent = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
            nameElement.style.color = '#4CAF50';

            // Save to localStorage for persistence
            localStorage.setItem(`initial-pose-${poseIndex}-image`, e.target.result);
            localStorage.setItem(`initial-pose-${poseIndex}-filename`, file.name);
        };
        reader.readAsDataURL(file);
    } else {
        // Reset if no file selected
        preview.style.display = 'none';
        icon.style.display = 'none';
        nameElement.textContent = '';
    }
}

let demoVideoFile = null;

function handleDemoVideoUpload(event) {
    const file = event.target.files[0];
    const controls = document.getElementById('demo-video-controls');
    const filename = document.getElementById('demo-video-filename');

    if (file) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
            alert('Пожалуйста, выберите действительный видеофайл');
            return;
        }

        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('Видеофайл слишком большой. Пожалуйста, выберите видео меньше 100МБ.');
            return;
        }

        const url = URL.createObjectURL(file);

        // Store the video file reference for fullscreen opening
        demoVideoFile = {
            file: file,
            url: url,
            name: file.name
        };

        // Show controls and filename
        controls.style.display = 'block';
        filename.textContent = file.name.length > 40 ? file.name.substring(0, 37) + '...' : file.name;

        // Save video file reference
        localStorage.setItem('demo-video-uploaded', 'true');
        localStorage.setItem('demo-video-name', file.name);

        console.log(`Demo video loaded: ${file.name}`);
    } else {
        // Reset if no file selected
        controls.style.display = 'none';
        demoVideoFile = null;
    }
}

function openDemoVideoFullscreen() {
    if (!demoVideoFile) {
        alert('Демо видеофайл не загружен');
        return;
    }

    const modal = document.getElementById('fullscreen-video-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');

    fullscreenVideo.src = demoVideoFile.url;
    modal.style.display = 'flex';
}

// Local video file storage
const localVideoFiles = new Map();

function handleMediaFileUpload(event, index) {
    const file = event.target.files[0];
    const videoPreview = document.getElementById(`video-preview-${index}`);
    const imagePreview = document.getElementById(`image-preview-${index}`);
    const mediaControls = document.getElementById(`media-controls-${index}`);
    const mediaFilename = document.getElementById(`media-filename-${index}`);
    const openMediaBtn = document.getElementById(`open-media-btn-${index}`);

    // Hide previews and controls initially
    if (videoPreview) videoPreview.style.display = 'none';
    if (imagePreview) imagePreview.style.display = 'none';
    if (mediaControls) mediaControls.style.display = 'none';

    if (file) {
        // Check if it's a video or image
        if (file.type.startsWith('video/')) {
            // Handle video file
            if (file.size > 100 * 1024 * 1024) {
                alert('Video file is too large. Please select a video smaller than 100MB.');
                return;
            }

            try {
                const url = URL.createObjectURL(file);
                if (videoPreview) {
                    videoPreview.src = url;
                    // Keep preview hidden, only load the video
                }

                // Store the video file reference
                localVideoFiles.set(index, {
                    file: file,
                    url: url,
                    name: file.name,
                    type: 'video'
                });

                // Show controls with button and filename
                if (mediaControls && mediaFilename && openMediaBtn) {
                    openMediaBtn.textContent = '▶ Open Video';
                    mediaFilename.textContent = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
                    mediaControls.style.display = 'block';
                }

                console.log(`Video file ${index} loaded: ${file.name}`);
            } catch (error) {
                console.error(`Error loading video file ${index}:`, error);
                alert(`Error loading video file: ${error.message}`);
                return;
            }
        } else if (file.type.startsWith('image/')) {
            // Handle image file
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл изображения слишком большой. Пожалуйста, выберите изображение меньше 5МБ.');
                return;
            }

            try {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (imagePreview) {
                        imagePreview.src = e.target.result;
                        // Keep preview hidden, only load the image
                    }
                };
                reader.readAsDataURL(file);

                // Store the image file reference
                localVideoFiles.set(index, {
                    file: file,
                    name: file.name,
                    type: 'image',
                    data: null // Will be set by FileReader
                });

                // Show controls with button and filename
                if (mediaControls && mediaFilename && openMediaBtn) {
                    openMediaBtn.textContent = '🖼 Open Image';
                    mediaFilename.textContent = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
                    mediaControls.style.display = 'block';
                }

                console.log(`Image file ${index} loaded: ${file.name}`);
            } catch (error) {
                console.error(`Error loading image file ${index}:`, error);
                alert(`Error loading image file: ${error.message}`);
                return;
            }
        } else {
            alert('Please select a valid video or image file');
            return;
        }

        // Save to localStorage (just the filename for reference)
        localStorage.setItem(`media-file-${index}`, file.name);
        localStorage.setItem(`media-type-${index}`, file.type.startsWith('video/') ? 'video' : 'image');
    }
}

function openMediaFullscreen(index) {
    const mediaData = localVideoFiles.get(index);
    if (!mediaData) {
        alert('Медиафайл не загружен для этого слота');
        return;
    }

    if (mediaData.type === 'video') {
        const modal = document.getElementById('fullscreen-video-modal');
        const fullscreenVideo = document.getElementById('fullscreen-video');
        fullscreenVideo.src = mediaData.url;
        modal.style.display = 'flex';
    } else if (mediaData.type === 'image') {
        const imagePreview = document.getElementById(`image-preview-${index}`);
        if (imagePreview && imagePreview.src) {
            openImageFullscreen(`image-preview-${index}`);
        } else {
            alert('Image not yet loaded');
        }
    }
}

function openFullscreenVideo(index) {
    const videoData = localVideoFiles.get(index);
    if (!videoData) {
        alert('No video file loaded for this slot');
        return;
    }

    const modal = document.getElementById('fullscreen-video-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');

    fullscreenVideo.src = videoData.url;
    modal.style.display = 'flex';

    // Pause the preview video
    const previewVideo = document.getElementById(`video-preview-${index}`);
    if (previewVideo) {
        previewVideo.pause();
    }
}

function closeFullscreenVideo() {
    const modal = document.getElementById('fullscreen-video-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');

    fullscreenVideo.pause();
    fullscreenVideo.src = '';
    modal.style.display = 'none';
}

// Close fullscreen on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeFullscreenVideo();
    }
});

// Close fullscreen when clicking outside the video
document.getElementById('fullscreen-video-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeFullscreenVideo();
    }
});

function openImageFullscreen(imageId) {
    const sourceImage = document.getElementById(imageId);
    if (!sourceImage || !sourceImage.src) {
        alert('No image to display');
        return;
    }

    const modal = document.getElementById('fullscreen-image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');

    fullscreenImage.src = sourceImage.src;
    modal.style.display = 'flex';
}

function closeFullscreenImage() {
    const modal = document.getElementById('fullscreen-image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');

    fullscreenImage.src = '';
    modal.style.display = 'none';
}

// Close fullscreen image on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeFullscreenVideo();
        closeFullscreenImage();
    }
});

// Close fullscreen when clicking outside the image
document.getElementById('fullscreen-image-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeFullscreenImage();
    }
});

function proceedToSettings() {
    document.getElementById('initial-page').classList.remove('active');
    document.getElementById('settings-page').classList.add('active');

    // Transfer any uploaded pose images to the main settings
    transferInitialPoseImages();
}

function transferInitialPoseImages() {
    for (let i = 1; i <= 7; i++) {
        const savedImage = localStorage.getItem(`initial-pose-${i}-image`);
        if (savedImage) {
            // Set the image in the main pose selection
            const mainPreview = document.getElementById(`pose-${i}-preview`);
            const poseItem = document.querySelector(`.pose-item:nth-child(${i})`);
            const fileLabel = document.querySelector(`label[for="pose-${i}-image"]`);

            if (mainPreview) {
                mainPreview.src = savedImage;
                mainPreview.style.display = 'block';
                poseImages.set(i - 1, savedImage);
            }

            if (poseItem) {
                poseItem.classList.add('has-image');
            }

            if (fileLabel) {
                fileLabel.textContent = 'Image Loaded';
                fileLabel.style.background = '#d4edda';
                fileLabel.style.color = '#155724';
            }
        }
    }
}

function loadInitialSetupData() {
    // Load pose images
    for (let i = 1; i <= 7; i++) {
        const savedImage = localStorage.getItem(`initial-pose-${i}-image`);
        const savedFilename = localStorage.getItem(`initial-pose-${i}-filename`);

        if (savedImage) {
            const preview = document.getElementById(`pose-${i}-preview`);
            const icon = document.getElementById(`pose-${i}-icon`);
            const nameElement = document.getElementById(`pose-${i}-name`);

            if (preview) {
                preview.src = savedImage;
                preview.style.display = 'block';
            }

            if (icon && nameElement && savedFilename) {
                icon.style.display = 'inline';
                nameElement.textContent = savedFilename.length > 20 ? savedFilename.substring(0, 17) + '...' : savedFilename;
                nameElement.style.color = '#4CAF50';
            }
        }
    }

    // Load video/image files (only filenames are stored in localStorage)
    for (let i = 1; i <= 10; i++) {
        const savedFilename = localStorage.getItem(`media-file-${i}`);
        const savedType = localStorage.getItem(`media-type-${i}`);
        if (savedFilename) {
            const mediaFilename = document.getElementById(`media-filename-${i}`);
            const mediaIcon = document.getElementById(`media-icon-${i}`);
            const mediaName = document.getElementById(`media-name-${i}`);

            if (mediaFilename && mediaIcon && mediaName) {
                // Set appropriate icon based on file type
                mediaIcon.textContent = savedType === 'video' ? '▶' : '🖼';
                mediaIcon.style.display = 'inline';
                mediaName.textContent = `Previously loaded: ${savedFilename}`;
                mediaName.style.color = '#666';
                mediaFilename.style.display = 'block';
            } else {
                // Fallback for old video-filename elements
                const oldFilename = document.getElementById(`video-filename-${i}`);
                if (oldFilename) {
                    oldFilename.textContent = `Previously loaded: ${savedFilename}`;
                    oldFilename.style.display = 'block';
                }
            }
        }
    }

    // Check if demo video was uploaded and show controls
    const demoVideoUploaded = localStorage.getItem('demo-video-uploaded');
    if (demoVideoUploaded === 'true') {
        const videoName = localStorage.getItem('demo-video-name');
        if (videoName) {
            const controls = document.getElementById('demo-video-controls');
            const filename = document.getElementById('demo-video-filename');

            if (controls && filename) {
                controls.style.display = 'block';
                filename.textContent = `Previously uploaded: ${videoName}`;
                filename.style.color = '#666';
            }

            console.log(`Demo video previously uploaded: ${videoName}`);
        }
    }
}

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', async function() {
    const settings = loadSettings();
    console.log('Settings loaded:', settings);

    // Apply settings to form
    document.getElementById('audio-enabled').checked = settings.audioEnabled;
    document.getElementById('recognition-delay').value = settings.recognitionDelay;
    document.getElementById('accuracy-threshold').value = settings.accuracyThreshold;

    // Load pose checkboxes state
    if (settings.activePoses) {
        for (let i = 0; i < 7; i++) {
            const checkbox = document.getElementById(`pose-${i + 1}-enabled`);
            if (checkbox) {
                checkbox.checked = settings.activePoses[i] || false;
            }
        }
    }

    // Load and clean custom pose names with Windows encoding fixes
    if (settings.poseNames && settings.poseNames.length > 0) {
        for (let i = 0; i < 7; i++) {
            const label = document.querySelector(`label[for="pose-${i + 1}-enabled"]`);
            if (label && settings.poseNames[i]) {
                // Use saved pose name or default
                let cleanName = settings.poseNames[i] || poses[i].name;

                // Set the name and make it editable
                label.textContent = cleanName;
                label.contentEditable = 'true';
                label.style.cursor = 'text';
                label.style.border = '1px dashed #ccc';
                label.style.padding = '2px 5px';
                label.style.borderRadius = '3px';
                label.title = 'Click to edit pose name';

                // Update settings with clean name
                settings.poseNames[i] = cleanName;
            }
        }
        // Save the cleaned pose names
        saveSettings(settings);
        console.log('All pose names loaded and made editable');
    } else {
        // Initialize with default pose names if none saved
        for (let i = 0; i < 7; i++) {
            const label = document.querySelector(`label[for="pose-${i + 1}-enabled"]`);
            if (label && poses[i]) {
                label.textContent = poses[i].name;
                label.contentEditable = 'true';
                label.style.cursor = 'text';
                label.style.border = '1px dashed #ccc';
                label.style.padding = '2px 5px';
                label.style.borderRadius = '3px';
                label.title = 'Click to edit pose name';
            }
        }
    }

    // Update accuracy display
    document.getElementById('accuracy-value').textContent = settings.accuracyThreshold;

    // Add pose checkbox listeners to save selection
    for (let i = 1; i <= 7; i++) {
        const checkbox = document.getElementById(`pose-${i}-enabled`);
        if (checkbox) {
            checkbox.addEventListener('change', savePoseSelection);
        }
    }

    // Add local file handlers
    document.getElementById('model-json').addEventListener('change', (e) => handleLocalFile(e, 'modelJson'));
    document.getElementById('metadata-json').addEventListener('change', (e) => handleLocalFile(e, 'metadataJson'));
    document.getElementById('weights-bin').addEventListener('change', (e) => handleLocalFile(e, 'weightsBin'));

    // Load pose images and local model files
    await loadPoseImages();
    await loadLocalModelFiles();

    // Initialize class counter
    updateModelClassCounter();

    // Load initial setup data
    loadInitialSetupData();

    console.log('App initialization complete. All saved settings and model files have been restored.');
});

async function loadPoseImages() {
    // First, clean up any old localStorage image data to free space
    for (let i = 1; i <= 7; i++) {
        const oldKey = `pose-${i}-image`;
        if (localStorage.getItem(oldKey)) {
            localStorage.removeItem(oldKey);
            console.log(`Removed old localStorage data for pose ${i}`);
        }
    }

    for (let index = 0; index < poses.length; index++) {
        const preview = document.getElementById(`pose-${index + 1}-preview`);
        const fileLabel = document.querySelector(`label[for="pose-${index + 1}-image"]`);

        // Try to load from IndexedDB first
        let savedImage = await loadImageFromDB(index + 1);

        // Fallback to localStorage for backward compatibility (but clean it up)
        if (!savedImage) {
            savedImage = localStorage.getItem(`pose-${index + 1}-image`);
            if (savedImage) {
                // Migrate from localStorage to IndexedDB
                const migrated = await saveImageToDB(savedImage, index + 1);
                if (migrated) {
                    // Remove from localStorage to free space
                    localStorage.removeItem(`pose-${index + 1}-image`);
                    console.log(`Migrated pose ${index + 1} image from localStorage to IndexedDB`);
                }
            }
        }

        if (savedImage) {
            preview.src = savedImage;
            preview.style.display = 'block';
            preview.classList.add('visible');
            preview.onclick = () => openImageFullscreen(`pose-${index + 1}-preview`);
            poseImages.set(index, savedImage);

            // Add visual indicator that image is uploaded
            const poseItem = document.querySelector(`.pose-item:nth-child(${index + 1})`);
            if (poseItem) {
                poseItem.classList.add('has-image');
            }

            // Update file label to show image is loaded
            if (fileLabel) {
                fileLabel.textContent = 'Image Loaded';
                fileLabel.style.background = '#d4edda';
                fileLabel.style.color = '#155724';
            }
        } else {
            // Ensure label shows default text if no image and hide preview
            if (fileLabel) {
                fileLabel.textContent = 'Choose File';
                fileLabel.style.background = '#e9ecef';
                fileLabel.style.color = '#495057';
            }
            if (preview) {
                preview.style.display = 'none';
            }
        }
    }
}

async function handleImageUpload(event, poseIndex) {
    const file = event.target.files[0];
    const preview = document.getElementById(`pose-${poseIndex}-preview`);
    const poseItem = event.target.closest('.pose-item');
    const fileLabel = event.target.nextElementSibling;

    if (file) {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите действительный файл изображения (JPG, PNG, GIF и т.д.)');
                return;
            }

            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл изображения слишком большой. Пожалуйста, выберите изображение меньше 5МБ.');
                return;
            }

            console.log(`Processing image for pose ${poseIndex}:`, file.name, `(${Math.round(file.size/1024)}KB)`);

            // Compress image to reduce storage size
            const compressedImageData = await compressImage(file);

            // Show image preview immediately with proper styling
            if (preview) {
                preview.src = compressedImageData;
                preview.style.display = 'block';
                preview.classList.add('visible');
                preview.onclick = () => openImageFullscreen(`pose-${poseIndex}-preview`);
            }

            poseImages.set(poseIndex - 1, compressedImageData);

            // Add visual indicator that image is uploaded
            if (poseItem) {
                poseItem.classList.add('has-image');
            }

            // Update file label to show success - but keep pose name editable
            if (fileLabel) {
                const displayName = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;
                fileLabel.textContent = 'Image Loaded';
                fileLabel.style.background = '#d4edda';
                fileLabel.style.color = '#155724';
                fileLabel.style.fontWeight = 'bold';
            }

            // Keep pose name label editable
            const poseNameLabel = document.querySelector(`label[for="pose-${poseIndex}-enabled"]`);
            if (poseNameLabel) {
                poseNameLabel.style.pointerEvents = 'auto';
                poseNameLabel.contentEditable = 'true';
                poseNameLabel.style.cursor = 'text';
                poseNameLabel.style.border = '1px dashed #ccc';
                poseNameLabel.style.padding = '2px 5px';
                poseNameLabel.style.borderRadius = '3px';
                poseNameLabel.title = 'Click to edit pose name';
            }

            // Save to IndexedDB
            const saved = await saveImageToDB(compressedImageData, poseIndex);

            if (saved) {
                console.log(`Pose ${poseIndex} image uploaded and saved successfully`);
            } else {
                console.warn(`Pose ${poseIndex} image uploaded but failed to save to IndexedDB`);
                alert(`Warning: Could not save pose ${poseIndex} image to storage. The image will work for this session only.`);
            }
        } catch (error) {
            console.error(`Error processing pose ${poseIndex} image:`, error);
            alert(`Error uploading pose ${poseIndex} image: ${error.message || 'Unknown error'}`);

            // Reset on error
            if (fileLabel) {
                fileLabel.textContent = 'Choose File';
                fileLabel.style.background = '#e9ecef';
                fileLabel.style.color = '#495057';
            }
            if (poseItem) {
                poseItem.classList.remove('has-image');
            }
            if (preview) {
                preview.style.display = 'none';
            }
        }
    } else {
        // Reset label if no file selected
        if (fileLabel) {
            fileLabel.textContent = 'Choose File';
            fileLabel.style.background = '#e9ecef';
            fileLabel.style.color = '#495057';
        }
        if (poseItem) {
            poseItem.classList.remove('has-image');
        }
        if (preview) {
            preview.style.display = 'none';
        }
    }
}

function updatePoseName(labelElement, poseIndex) {
    const settings = loadSettings();

    // Get the raw text content
    let rawName = labelElement.textContent || labelElement.innerText || '';

    // Clean the name but be less aggressive to allow user input
    let cleanName = rawName
        .replace(/[\n\r\t]/g, ' ')             // Remove newlines, tabs
        .replace(/\s+/g, ' ')                  // Replace multiple spaces with single space
        .trim();

    // Only use default if name is completely empty or just whitespace
    if (cleanName.length === 0 || /^\s*$/.test(cleanName)) {
        cleanName = poses[poseIndex - 1].name;
        console.log(`Pose ${poseIndex} name was empty, using default: ${cleanName}`);
    }

    // Ensure the name is not too long
    if (cleanName.length > 20) {
        cleanName = cleanName.substring(0, 20).trim();
    }

    settings.poseNames[poseIndex - 1] = cleanName;

    // Update the display with clean name
    labelElement.textContent = cleanName;

    saveSettings(settings);
    console.log(`Updated pose ${poseIndex} name to: ${cleanName}`);
}

function updateAccuracyDisplay() {
    const slider = document.getElementById('accuracy-threshold');
    const display = document.getElementById('accuracy-value');
    display.textContent = slider.value;
}

// Ensure navigation functions are properly defined
window.showPoseImagesSection = showPoseImagesSection;
window.showDemoVideoSection = showDemoVideoSection;
window.showVideoLinksSection = showVideoLinksSection;
window.backToFirstScreen = backToFirstScreen;
window.proceedToSettings = proceedToSettings;



function handleLocalFile(event, fileType) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            if (fileType === 'weightsBin') {
                localModelFiles[fileType] = e.target.result;

                // Automatically save weights.bin to IndexedDB
                const saved = await saveWeightsToDB(e.target.result);
                if (!saved) {
                    console.warn('Failed to save weights.bin to IndexedDB');
                }
            } else {
                try {
                    localModelFiles[fileType] = JSON.parse(e.target.result);
                } catch (error) {
                    alert(`Invalid JSON file: ${file.name}`);
                    return;
                }
            }

            // Update label to show file is loaded
            const label = event.target.nextElementSibling;
            label.classList.add('file-loaded');
            label.textContent = `[OK] ${file.name}`;

            console.log(`Loaded ${fileType}:`, file.name);

            // Save to appropriate storage
            if (fileType === 'weightsBin') {
                // Already saved to IndexedDB above
            } else {
                saveLocalModelFiles();
            }

            // Update class counter when metadata is loaded
            if (fileType === 'metadataJson') {
                updateModelClassCounter();
            }
        };

        if (fileType === 'weightsBin') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }
}

async function validateLocalFiles() {
    const errors = [];

    // Try to load weights from IndexedDB if not already loaded
    if (!localModelFiles.weightsBin) {
        const weightsData = await loadWeightsFromDB();
        if (weightsData) {
            localModelFiles.weightsBin = weightsData;
            console.log('Loaded weights.bin from IndexedDB during validation');
        }
    }

    if (!localModelFiles.modelJson) {
        errors.push('model.json file is missing - please upload');
    }
    if (!localModelFiles.metadataJson) {
        errors.push('metadata.json file is missing - please upload');
    }
    if (!localModelFiles.weightsBin) {
        errors.push('weights.bin file is missing - please upload');
    }

    if (errors.length > 0) {
        console.error('Local model validation failed:', errors.join(', '));
        return false;
    }

    // Additional validation for file structure
    try {
        if (localModelFiles.modelJson && !localModelFiles.modelJson.weightsManifest) {
            errors.push('model.json does not contain weightsManifest - invalid file format');
        }
        if (localModelFiles.metadataJson && !localModelFiles.metadataJson.labels) {
            errors.push('metadata.json does not contain labels - invalid file format');
        }
    } catch (e) {
        errors.push('Invalid JSON structure in model files');
    }

    if (errors.length > 0) {
        console.error('Local model structure validation failed:', errors.join(', '));
        return false;
    }

    return true;
}

function resetRecognitionState() {
    isRecognitionRunning = false;
    sequenceIndex = 0;
    lastPoseTime = 0;
    isTransitioning = false;
    confidenceScore = 0;

    // Reset UI elements
    document.getElementById('timer-display').style.display = 'none';

    // Reset confidence display
    const confidenceBar = document.querySelector('.confidence-bar');
    const confidenceText = document.querySelector('.confidence-text');
    if (confidenceBar && confidenceText) {
        confidenceBar.style.width = '0%';
        confidenceBar.classList.remove('correct');
        confidenceText.textContent = 'Confidence: 0%';
    }

    // Reset pose compare image
    const poseCompare = document.getElementById('pose-compare');
    if (poseCompare) {
        poseCompare.className = 'pose-compare waiting';
    }
}

function refreshRecognition() {
    console.log('Refreshing recognition - restarting from pose 1');

    // Reset to first pose
    sequenceIndex = 0;
    lastPoseTime = 0;
    isTransitioning = false;
    confidenceScore = 0;

    // Update current pose display
    updateCurrentPose();

    // Reset timer and confidence displays
    document.getElementById('timer-display').style.display = 'none';
    const confidenceBar = document.querySelector('.confidence-bar');
    const confidenceText = document.querySelector('.confidence-text');
    if (confidenceBar && confidenceText) {
        confidenceBar.style.width = '0%';
        confidenceBar.classList.remove('correct');
        confidenceText.textContent = 'Confidence: 0%';
    }

    // Reset pose compare image
    const poseCompare = document.getElementById('pose-compare');
    if (poseCompare) {
        poseCompare.className = 'pose-compare waiting';
    }
}

async function startRecognition() {
    // Get active poses
    const activePosesList = getActivePoses();
    if (activePosesList.length === 0) {
        alert('Невозможно начать распознавание\n\nПожалуйста, выберите хотя бы одну позу для практики.');
        return;
    }

    // Validate pose images for active poses
    const missingPoseImages = [];
    for (const poseIndex of activePosesList) {
        const savedImage = poseImages.get(poseIndex);
        if (!savedImage) {
            // Always use the original pose name from poses array
            const poseName = poses[poseIndex].name;
            missingPoseImages.push(`• ${poseName}`);
        }
    }

    if (missingPoseImages.length > 0) {
        alert(`Невозможно начать распознавание\n\nОтсутствуют изображения поз для выбранных поз:\n${missingPoseImages.join('\n')}\n\nПожалуйста, загрузите изображения для всех выбранных поз перед началом распознавания.`);
        return;
    }

    // Save current settings
    const settings = {
        audioEnabled: document.getElementById('audio-enabled').checked,
        recognitionDelay: parseInt(document.getElementById('recognition-delay').value),
        accuracyThreshold: parseFloat(document.getElementById('accuracy-threshold').value),
        activePoses: [],
        poseNames: []
    };

    // Save active poses state and custom names
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`pose-${i + 1}-enabled`);
        settings.activePoses[i] = checkbox ? checkbox.checked : false;

        // Save custom pose names from labels with cleaning
        const label = document.querySelector(`label[for="pose-${i + 1}-enabled"]`);
        if (label) {
            let cleanName = label.textContent
                .replace(/[\n\r\t]/g, ' ')      // Remove newlines, tabs
                .replace(/[^\w\s()]/g, ' ')     // Remove special characters except parentheses
                .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
                .replace(/^[^a-zA-Z]*/, '')     // Remove any non-letter characters at start
                .trim();

            // If name becomes empty or too short, use default
            if (cleanName.length < 3) {
                cleanName = poses[i].name;
            }

            settings.poseNames[i] = cleanName;
            label.textContent = cleanName; // Update display immediately
        }
    }

    saveSettings(settings);

    // Ensure all saved files are loaded first
    await loadLocalModelFiles();

    const missingFiles = [];

    // Check if files are loaded in memory or available in storage
    if (!localModelFiles.modelJson) {
        const savedModelJson = localStorage.getItem('localModelJson');
        if (savedModelJson) {
            try {
                localModelFiles.modelJson = JSON.parse(savedModelJson);
            } catch (e) {
                missingFiles.push('model.json (corrupted)');
            }
        } else {
            missingFiles.push('model.json');
        }
    }

    if (!localModelFiles.metadataJson) {
        const savedMetadataJson = localStorage.getItem('localMetadataJson');
        if (savedMetadataJson) {
            try {
                localModelFiles.metadataJson = JSON.parse(savedMetadataJson);
            } catch (e) {
                missingFiles.push('metadata.json (corrupted)');
            }
        } else {
            missingFiles.push('metadata.json');
        }
    }

    if (!localModelFiles.weightsBin) {
        // Try to load from IndexedDB
        const weightsData = await loadWeightsFromDB();
        if (weightsData) {
            localModelFiles.weightsBin = weightsData;
        } else {
            missingFiles.push('weights.bin');
        }
    }

    if (missingFiles.length > 0) {
        alert(`Невозможно начать распознавание\n\nОтсутствуют необходимые файлы модели:\n${missingFiles.join('\n')}\n\nПожалуйста, загрузите все 3 файла модели перед началом распознавания.`);
        return;
    }

    // Additional validation for file structure
    const isValid = await validateLocalFiles();
    if (!isValid) {
        alert('Невозможно начать распознавание\n\nОбнаружены недействительные файлы модели. Пожалуйста, убедитесь, что вы загрузили действительные файлы модели поз Teachable Machine:\n• model.json\n• metadata.json\n• weights.bin');
        return;
    }

    // Show loading and switch to recognition page
    document.getElementById('settings-page').classList.remove('active');
    document.getElementById('recognition-page').classList.add('active');

    try {
        await initLocalModel();
        await startCameraRecognition();
    } catch (error) {
        console.error('Failed to start recognition:', error);
        alert('Failed to start recognition. Please ensure your model files are valid Teachable Machine pose model files (model.json, metadata.json, weights.bin) and try again.');
        showSettingsPage();
    }
}



async function initLocalModel() {
    console.log('Loading local model files...');

    try {
        // Validate files are loaded
        if (!localModelFiles.modelJson || !localModelFiles.metadataJson || !localModelFiles.weightsBin) {
            throw new Error('Missing required model files');
        }

        console.log('Creating model blob URLs...');

        // Create metadata blob first
        const metadataBlob = new Blob([JSON.stringify(localModelFiles.metadataJson)], {type: 'application/json'});
        const metadataUrl = URL.createObjectURL(metadataBlob);
        console.log('Metadata URL created:', metadataUrl);

        // Create weights blob with proper binary data
        let weightsData;
        if (localModelFiles.weightsBin instanceof ArrayBuffer) {
            weightsData = localModelFiles.weightsBin;
        } else {
            throw new Error('Weights data is not in the correct format (should be ArrayBuffer)');
        }

        const weightsBlob = new Blob([weightsData], {type: 'application/octet-stream'});
        const weightsUrl = URL.createObjectURL(weightsBlob);
        console.log('Weights URL created:', weightsUrl);

        // Create a modified model.json that points to our blob URL for weights
        const modifiedModelJson = JSON.parse(JSON.stringify(localModelFiles.modelJson));

        // Update the weights manifest to point to our blob URL
        if (modifiedModelJson.weightsManifest && modifiedModelJson.weightsManifest.length > 0) {
            // Replace the weights path with our blob URL
            modifiedModelJson.weightsManifest[0].paths = ['./weights.bin'];
            console.log('Updated weightsManifest paths');
        } else {
            throw new Error('Model file does not contain valid weightsManifest');
        }

        // Create model blob
        const modelBlob = new Blob([JSON.stringify(modifiedModelJson)], {type: 'application/json'});
        const modelUrl = URL.createObjectURL(modelBlob);
        console.log('Model URL created:', modelUrl);

        // Create a custom fetch function that intercepts requests for weights.bin
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && url.includes('weights.bin')) {
                console.log('Intercepting weights.bin request, returning local blob');
                return Promise.resolve(new Response(weightsBlob));
            }
            return originalFetch.call(this, url, options);
        };

        try {
            // Load the model with local files
            console.log('Loading model with blob URLs:', { modelUrl, metadataUrl });
            model = await tmPose.load(modelUrl, metadataUrl);
        maxPredictions = model.getTotalClasses();
        console.log('Local model loaded successfully. Classes:', maxPredictions);

        // Log model classes for debugging
        if (localModelFiles.metadataJson && localModelFiles.metadataJson.labels) {
            console.log('Model class labels:', localModelFiles.metadataJson.labels);
        }

        // Update class counter after model loads
        updateModelClassCounter();
    } finally {
        // Restore original fetch
        window.fetch = originalFetch;

        // Clean up blob URLs
        URL.revokeObjectURL(modelUrl);
        URL.revokeObjectURL(metadataUrl);
        URL.revokeObjectURL(weightsUrl);
    }

        await setupCamera();

    } catch (error) {
        console.error('Failed to initialize local model:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            modelJsonLoaded: !!localModelFiles.modelJson,
            metadataJsonLoaded: !!localModelFiles.metadataJson,
            weightsBinLoaded: !!localModelFiles.weightsBin,
            weightsBinType: localModelFiles.weightsBin ? localModelFiles.weightsBin.constructor.name : 'undefined'
        });
        throw error;
    }
}

async function setupCamera() {
    try {
        // Set up webcam with Windows-friendly settings
        const flip = true;

        // Try different resolutions for better Windows compatibility
        const resolutions = [
            { width: 640, height: 480 },
            { width: 480, height: 360 },
            { width: 320, height: 240 }
        ];

        let setupSuccessful = false;

        for (const res of resolutions) {
            try {
                console.log(`Trying camera resolution: ${res.width}x${res.height}`);
                webcam = new tmPose.Webcam(res.width, res.height, flip);
                await webcam.setup();
                console.log(`Camera setup successful at ${res.width}x${res.height}`);
                setupSuccessful = true;
                break;
            } catch (resError) {
                console.log(`Failed at ${res.width}x${res.height}:`, resError.message);
                continue;
            }
        }

        if (!setupSuccessful) {
            throw new Error('Failed to initialize camera at any resolution');
        }

        // Clear previous webcam if exists
        const container = document.getElementById('webcam-container');
        if (!container) {
            // Create webcam container if it doesn't exist
            const videoContainer = document.querySelector('.video-container');
            const webcamContainer = document.createElement('div');
            webcamContainer.id = 'webcam-container';
            videoContainer.appendChild(webcamContainer);
        }

        // Clear existing webcam canvas
        container.innerHTML = '';
        container.appendChild(webcam.canvas);

        // Set up canvas for drawing - match webcam resolution
        const canvas = document.getElementById('output');
        canvas.width = webcam.canvas.width;
        canvas.height = webcam.canvas.height;
        ctx = canvas.getContext('2d');

        // Enable hardware acceleration if available
        if (ctx.imageSmoothingEnabled !== undefined) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }

        console.log('Webcam and canvas set up successfully');

    } catch (error) {
        console.error('Camera setup failed:', error);
        alert('Настройка камеры не удалась. Пожалуйста, убедитесь:\n1. Разрешения камеры предоставлены\n2. Камера не используется другим приложением\n3. Попробуйте обновить страницу');
        throw error;
    }
}

function showSettingsPage() {
    // Stop any ongoing recognition
    stopCameraRecognition();

    // Switch pages
    document.getElementById('recognition-page').classList.remove('active');
    document.getElementById('settings-page').classList.add('active');

    console.log('Returned to settings page');
}

function showFirstScreen() {
    // Switch from settings back to initial page
    document.getElementById('settings-page').classList.remove('active');
    document.getElementById('initial-page').classList.add('active');

    console.log('Returned to first screen');
}

async function startCameraRecognition() {
    try {
        console.log('Starting camera recognition...');

        // Get active poses and ensure we have at least one
        getActivePoses();
        if (poseSequence.length === 0) {
            alert('Please select at least one pose to practice.');
            return;
        }

        // Reset state
        isRecognitionRunning = true;
        sequenceIndex = 0;
        lastPoseTime = 0;
        isTransitioning = false;
        confidenceScore = 0;

        // Ensure webcam is properly initialized
        if (!webcam || !model) {
            throw new Error('Webcam or model not initialized');
        }

        await webcam.play();
        updateCurrentPose();
        requestAnimationFrame(loop);

    } catch (error) {
        console.error('Error starting camera recognition:', error);
        alert('Failed to start camera. Please ensure camera permissions are granted.');
        isRecognitionRunning = false;
    }
}

function stopCameraRecognition() {
    console.log('Stopping camera recognition...');

    // Stop webcam properly
    if (webcam) {
        webcam.stop();
    }

    // Clear canvas
    if (ctx) {
        ctx.clearRect(0, 0, 640, 480);
    }

    // Reset all state
    resetRecognitionState();

    console.log('Camera recognition stopped');
}

function updateCurrentPose() {
    if (poseSequence.length === 0) return;

    const expectedPoseIndex = poseSequence[sequenceIndex];
    const settings = loadSettings();
    const expectedPoseName = settings.poseNames[expectedPoseIndex] || poses[expectedPoseIndex].name;

    // Update expected pose display
    const poseNameElement = document.getElementById('pose-name');
    poseNameElement.innerHTML = `<strong>Ожидаемая поза:</strong> ${expectedPoseName}<br><strong>Текущая поза:</strong> <span id="detected-pose">Определение...</span><br><span id="distance-feedback"></span>`;

    const poseCompare = document.getElementById('pose-compare');
    const savedImage = poseImages.get(expectedPoseIndex);

    if (savedImage) {
        poseCompare.src = savedImage;
        poseCompare.style.display = 'block';
    } else {
        poseCompare.style.display = 'none';
    }

    // Reset pose state
    poseCompare.className = 'pose-compare waiting';
}

function analyzeBodyDistance(pose) {
    if (!pose || !pose.keypoints) return null;

    // Calculate shoulder width (distance between shoulders)
    const leftShoulder = pose.keypoints[5];  // Left shoulder
    const rightShoulder = pose.keypoints[6]; // Right shoulder

    if (leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
        const shoulderDistance = Math.sqrt(
            Math.pow(rightShoulder.position.x - leftShoulder.position.x, 2) +
            Math.pow(rightShoulder.position.y - rightShoulder.position.y, 2)
        );

        // Optimal shoulder distance range (in pixels) for good recognition
        // These values work well for most webcams at proper distance
        const optimalMin = 80;  // Too close if shoulder width > 120px
        const optimalMax = 120; 
        const tooFarThreshold = 60; // Too far if shoulder width < 60px

        let feedback = "";
        let feedbackColor = "#4CAF50";

        if (shoulderDistance > optimalMax) {
            feedback = "Отойдите назад - Вы слишком близко к камере";
            feedbackColor = "#ff6b6b";
        } else if (shoulderDistance < tooFarThreshold) {
            feedback = "Подойдите ближе - Вы слишком далеко от камеры";
            feedbackColor = "#ff6b6b";
        } else {
            feedback = "Идеальное расстояние! ";
            feedbackColor = "#4CAF50";
        }

        return { distance: shoulderDistance, feedback, color: feedbackColor };
    }

    return null;
}

function updateCurrentPoseDisplay(detectedPoseIndex, confidence) {
    const detectedPoseElement = document.getElementById('detected-pose');
    if (!detectedPoseElement) return;

    const settings = loadSettings();

    if (detectedPoseIndex >= 0 && detectedPoseIndex < poses.length && confidence > 0.3) {
        // Get the detected pose name
        const detectedPoseName = settings.poseNames[detectedPoseIndex] || poses[detectedPoseIndex].name;
        const confidencePercent = Math.round(confidence * 100);

        // Color code based on whether it matches expected pose
        const expectedPoseIndex = poseSequence.length > 0 ? poseSequence[sequenceIndex] : -1;
        const isCorrect = detectedPoseIndex === expectedPoseIndex;

        detectedPoseElement.innerHTML = `<span style="color: ${isCorrect ? '#4CAF50' : '#ff6b6b'};">${detectedPoseName} (${confidencePercent}%)</span>`;
    } else {
        detectedPoseElement.innerHTML = '<span style="color: #666;">Определение...</span>';
    }
}

// Add frame rate control for better Windows performance
let lastFrameTime = 0;
const targetFPS = 15; // Reduced from ~60fps for better Windows compatibility
const frameInterval = 1000 / targetFPS;

async function loop() {
    if (!isRecognitionRunning) return;

    const currentTime = Date.now();

    // Control frame rate for better Windows performance
    if (currentTime - lastFrameTime < frameInterval) {
        requestAnimationFrame(loop);
        return;
    }

    lastFrameTime = currentTime;

    try {
        webcam.update();
        await predict();
        requestAnimationFrame(loop);
    } catch (error) {
        console.error('Error in recognition loop:', error);
        console.log('Attempting to recover...');
        // Try to recover instead of stopping completely
        setTimeout(() => {
            if (isRecognitionRunning) {
                requestAnimationFrame(loop);
            }
        }, 1000);
    }
}

async function predict() {
    if (!model || !webcam.canvas) return;

    try {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);

        // Clear canvas
        ctx.clearRect(0, 0, 640, 480);

        // Validate Google's PoseNet output structure
        if (pose && pose.keypoints && pose.keypoints.length === 17) {
            drawPose(pose);

            // Analyze body distance for calibration feedback
            const distanceAnalysis = analyzeBodyDistance(pose);
            const distanceFeedback = document.getElementById('distance-feedback');
            if (distanceFeedback && distanceAnalysis) {
                distanceFeedback.innerHTML = `<span style="color: ${distanceAnalysis.color}; font-size: 14px;">${distanceAnalysis.feedback}</span>`;
            }

            // Log pose quality for debugging (Google's requirements)
            const validKeypoints = pose.keypoints.filter(kp => kp.score > 0.2).length;
            if (validKeypoints < 5) {
                console.log('Low pose quality detected - only', validKeypoints, 'keypoints above threshold');
                // Lower threshold for Windows compatibility
                const windowsValidKeypoints = pose.keypoints.filter(kp => kp.score > 0.1).length;
                if (windowsValidKeypoints < 3) {
                    console.log('Very low pose quality - consider improving lighting or camera position');
                }
            }
        } else {
            console.log('Invalid pose structure detected from Teachable Machine model');
        }

        // Find the currently detected pose (highest confidence)
        let detectedPoseIndex = -1;
        let highestConfidence = 0;

        if (prediction && Array.isArray(prediction)) {
            // Find pose with highest confidence
            prediction.forEach((p, i) => {
                if (p.probability > highestConfidence) {
                    highestConfidence        = p.probability;
                    detectedPoseIndex = i;
                }
            });

            // Update current pose display
            updateCurrentPoseDisplay(detectedPoseIndex, highestConfidence);

            // Log all class probabilities for debugging
            const debugPredictions = prediction.map((p, i) => `Class ${i}: ${Math.round(p.probability * 100)}%`);
            console.log('Model predictions:', debugPredictions.join(', '));
        }

        // Get expected pose in sequence
        if (poseSequence.length === 0) return;
        const expectedPoseIndex = poseSequence[sequenceIndex];

        // Get expected pose prediction confidence
        if (prediction && prediction.length > expectedPoseIndex) {
            confidenceScore = prediction[expectedPoseIndex].probability;
            updateConfidenceDisplay();

            const settings = loadSettings();
            const threshold = settings.accuracyThreshold;

            if (confidenceScore >= threshold) {
                handleCorrectPose();
            } else {
                resetPoseTimer();
            }
        }

    } catch (error) {
        console.error('Prediction error:', error);
        console.error('This may indicate an issue with the Teachable Machine model format');
    }
}

function updateConfidenceDisplay() {
    const confidenceBar = document.querySelector('.confidence-bar');
    const confidenceText = document.querySelector('.confidence-text');
    const poseCompare = document.getElementById('pose-compare');

    if (confidenceBar && confidenceText) {
        const percentage = Math.round(confidenceScore * 100);
        confidenceBar.style.width = percentage + '%';
        confidenceText.textContent = `Confidence: ${percentage}%`;

        const settings = loadSettings();
        const threshold = settings.accuracyThreshold;

        if (confidenceScore >= threshold) {
            confidenceBar.classList.add('correct');
            poseCompare.className = 'pose-compare correct';
        } else {
            confidenceBar.classList.remove('correct');
            poseCompare.className = 'pose-compare waiting';
        }
    }
}

function handleCorrectPose() {
    const settings = loadSettings();
    const currentTime = Date.now();

    if (lastPoseTime === 0) {
        lastPoseTime = currentTime;
        showTimer(settings.recognitionDelay);
    }

    const elapsed = (currentTime - lastPoseTime) / 1000;
    const remaining = Math.max(0, settings.recognitionDelay - elapsed);

    if (remaining <= 0) {
        moveToNextPose();
    } else {
        showTimer(Math.ceil(remaining));
    }
}

function resetPoseTimer() {
    lastPoseTime = 0;
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'none';
    }
}

function showTimer(seconds) {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.textContent = seconds;
        timerDisplay.style.display = 'block';
    }
}

function moveToNextPose() {
    const settings = loadSettings();

    if (settings.audioEnabled) {
        playSuccessSound();
    }

    lastPoseTime = 0;
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'none';
    }

    // Get the completed pose name before moving to next
    const completedPoseIndex = poseSequence[sequenceIndex];
    const completedPoseName = settings.poseNames[completedPoseIndex];

    // Move to next pose in sequence
    sequenceIndex = (sequenceIndex + 1) % poseSequence.length;
    updateCurrentPose();

    // Show congratulations message without popup
    console.log(`Great! You completed ${completedPoseName}. Now try the next pose!`);
}

function playSuccessSound() {
    try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('Audio not supported or blocked:', error);
    }
}

function drawPose(pose) {
    // Official Google PoseNet skeleton connections (17 keypoints)
    // Following Google's PoseNet model specification exactly
    const connections = [
        // Head connections
        [0, 1], [0, 2], [1, 3], [2, 4],
        // Torso connections  
        [5, 6], [5, 11], [6, 12], [11, 12],
        // Left arm connections
        [5, 7], [7, 9],
        // Right arm connections  
        [6, 8], [8, 10],
        // Left leg connections
        [11, 13], [13, 15],
        // Right leg connections
        [12, 14], [14, 16]
    ];

    // Draw skeleton lines with Google's recommended styling
    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let connection of connections) {
        const [pointA, pointB] = connection;
        const keypointA = pose.keypoints[pointA];
        const keypointB = pose.keypoints[pointB];

        // Use Google's confidence threshold (0.2)
        if (keypointA && keypointB && keypointA.score > 0.2 && keypointB.score > 0.2) {
            ctx.beginPath();
            ctx.moveTo(keypointA.position.x, keypointA.position.y);
            ctx.lineTo(keypointB.position.x, keypointB.position.y);
            ctx.stroke();
        }
    }

    // Draw keypoints with color coding based on Google's keypoint groups
    const keypointColors = [
        '#FF6B6B', '#FF6B6B', '#FF6B6B', '#FF6B6B', '#FF6B6B', // Head (0-4)
        '#4ECDC4', '#4ECDC4', '#4ECDC4', '#4ECDC4', '#4ECDC4', '#4ECDC4', // Arms (5-10)
        '#45B7D1', '#45B7D1', '#45B7D1', '#45B7D1', '#45B7D1', '#45B7D1'  // Legs (11-16)
    ];

    for (let i = 0; i < pose.keypoints.length; i++) {
        const keypoint = pose.keypoints[i];
        if (keypoint.score > 0.2) {
            ctx.beginPath();
            ctx.arc(keypoint.position.x, keypoint.position.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = keypointColors[i] || '#FF6B6B';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}