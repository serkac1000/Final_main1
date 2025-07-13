class LaTeXConverter {
    constructor() {
        this.texFileInput = document.getElementById('tex-file');
        this.imageFilesInput = document.getElementById('image-files');
        this.videoFilesInput = document.getElementById('video-files');
        this.startCreateBtn = document.getElementById('startCreateBtn');
        this.status = document.getElementById('status');
        this.mediaFiles = [];

        this.init();
    }

    init() {
        this.texFileInput.addEventListener('change', (e) => this.handleTexFileSelect(e));
        this.imageFilesInput.addEventListener('change', (e) => this.handleMediaFileSelect(e, 'image'));
        this.videoFilesInput.addEventListener('change', (e) => this.handleMediaFileSelect(e, 'video'));
    }

    handleTexFileSelect(e) {
        const file = e.target.files[0];
        const selectedDiv = document.getElementById('tex-file-selected');

        if (file) {
            selectedDiv.textContent = `Selected: ${file.name}`;
            selectedDiv.style.display = 'block';
        } else {
            selectedDiv.style.display = 'none';
        }
    }

    handleMediaFileSelect(e, type) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            this.mediaFiles.push({ file, type });
        });
        this.updateMediaFilesList();
    }

    updateMediaFilesList() {
        const listDiv = document.getElementById('media-files-list');
        if (this.mediaFiles.length === 0) {
            listDiv.textContent = 'No media files selected';
        } else {
            listDiv.innerHTML = this.mediaFiles.map((item, index) => 
                `<div>${item.type === 'image' ? '📸' : '🎥'} ${item.file.name}</div>`
            ).join('');
        }
    }

    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        this.status.style.display = 'block';
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.latexConverter = new LaTeXConverter();
});

function addImages() {
    document.getElementById('image-files').click();
}

function addVideos() {
    document.getElementById('video-files').click();
}

function clearMedia() {
    if (window.latexConverter) {
        window.latexConverter.mediaFiles = [];
        window.latexConverter.updateMediaFilesList();
    }
    document.getElementById('image-files').value = '';
    document.getElementById('video-files').value = '';
}

function startCreate() {
    console.log('Start Create button clicked');
    const fileInput = document.getElementById('tex-file');
    const languageInputs = document.querySelectorAll('input[name="language"]');
    const formatInputs = document.querySelectorAll('input[name="format"]');

    // Check if file is selected
    if (!fileInput.files || fileInput.files.length === 0) {
        showStatus('Please select a LaTeX file first', 'error');
        return;
    }

    // Get selected language
    let selectedLanguage = 'english';
    for (const input of languageInputs) {
        if (input.checked) {
            selectedLanguage = input.value;
            break;
        }
    }

    // Get selected format
    let selectedFormat = 'pptx';
    for (const input of formatInputs) {
        if (input.checked) {
            selectedFormat = input.value;
            break;
        }
    }

    showStatus('Creating presentation...', 'processing');

    const formData = new FormData();
    formData.append('tex_file', fileInput.files[0]);
    formData.append('language', selectedLanguage);
    formData.append('format', selectedFormat);

    // Add media files if any
    if (window.latexConverter && window.latexConverter.mediaFiles.length > 0) {
        window.latexConverter.mediaFiles.forEach((item, index) => {
            formData.append(`media_${index}`, item.file);
            formData.append(`media_type_${index}`, item.type);
        });
    }

    fetch('/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatus('Presentation created successfully!', 'success');
            if (data.download_url) {
                // Create download link
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = data.filename || 'presentation';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            showStatus('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showStatus('Error: ' + error.message, 'error');
    });
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}