
# Pose Recognition Web App

A web application that uses machine learning to recognize poses through webcam input with local model support and customizable settings.

## Features Overview

### 🎯 **Pose Recognition System**
- Real-time pose detection using webcam
- Support for 1-7 customizable poses
- Local model files support (no internet required after setup)
- Visual pose comparison with reference images
- Confidence scoring and accuracy thresholds

### 🔧 **Core Functions**

#### **Audio Control**
- **Enable/Disable Audio**: Toggle success beep sounds on/off
- **Purpose**: Provides audio feedback when poses are correctly held
- **Usage**: Check/uncheck "Audio Beep" in settings

#### **Recognition Delay**
- **Range**: 1-10 seconds
- **Purpose**: Time user must hold pose before moving to next
- **Usage**: Adjust "Delay (sec)" slider in settings
- **Default**: 3 seconds

#### **Accuracy Threshold**
- **Range**: 0.3 to 0.9 (30% to 90%)
- **Purpose**: Minimum confidence required for pose recognition
- **Usage**: Adjust "Accuracy" slider in settings
- **Default**: 0.5 (50%)

#### **Pose Selection (1-7 Poses)**
- **Flexibility**: Use any combination from 1 to 7 poses
- **Customization**: Select only poses you want to practice
- **Usage**: Check/uncheck pose checkboxes in settings
- **Note**: At least 1 pose must be selected to start recognition

### 📁 **Local Model Support**
- **No Internet Required**: Works completely offline after model upload
- **Required Files**:
  - `model.json` - Model architecture
  - `metadata.json` - Class labels and settings
  - `weights.bin` - Trained model weights
- **Model Source**: Export from Teachable Machine (Pose Project)
- **Storage**: Files saved locally in browser storage

### 🏷️ **Custom Pose Names**
- **Editable Labels**: Click on any pose name to edit
- **Persistence**: Custom names are saved automatically
- **Usage**: Click on pose label text and type new name
- **Default Names**: Mountain Pose, Tree Pose, Warrior I, Warrior II, Triangle Pose, Child's Pose, Downward Dog

### 📏 **Distance Calibration**
- **Auto-Detection**: App analyzes your distance from camera
- **Feedback**: Real-time guidance on positioning
- **Optimal Distance**: 3-4 feet (1-1.2 meters) from camera
- **Visual Cues**: 
  - Green: Perfect distance
  - Red: Too close/too far
- **Requirements**: Full body visible in frame

### 🖼️ **Pose Images**
- **Reference Images**: Upload images for each pose
- **Comparison**: Visual side-by-side comparison during recognition
- **Formats**: JPG, PNG, GIF supported
- **Storage**: Images compressed and saved locally
- **Size Limit**: 5MB per image

### 🔄 **Recognition Controls**

#### **Refresh Function**
- **Purpose**: Restart sequence from pose 1
- **Usage**: Click "Refresh (Restart from Pose 1)" button
- **Effect**: Resets timer and confidence without stopping camera

#### **Current vs Expected Pose**
- **Current Pose**: What the AI currently detects
- **Expected Pose**: What pose you should be doing
- **Color Coding**:
  - 🟢 Green: Correct pose detected
  - 🔴 Red: Different pose detected
  - ⚫ Gray: No pose detected

### 💾 **Data Management**
- **Save All Settings**: Preserves all configurations and model files
- **Clear Memory**: Removes all saved data (with confirmation)
- **Auto-Save**: Pose selections and names saved automatically
- **Persistence**: Settings survive browser restarts

## Setup Instructions

### 1. **Prepare Your Model**
1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Create a new "Pose Project"
3. Train your model with pose samples
4. Export model and download 3 files:
   - `model.json`
   - `metadata.json`
   - `weights.bin`

### 2. **Upload Model Files**
1. Click "Choose File" for each model file
2. Select corresponding files from your downloads
3. Wait for "[OK]" confirmation for each file
4. Model class counter should show number of classes

### 3. **Configure Poses**
1. Select which poses to use (1-7)
2. Upload reference images for selected poses
3. Customize pose names if desired
4. Adjust settings (audio, delay, accuracy)

### 4. **Start Recognition**
1. Click "Start Recognition"
2. Allow camera access when prompted
3. Position yourself according to distance feedback
4. Follow pose sequence as displayed

## Usage Tips

### **For Best Results:**
- Use good lighting
- Keep full body in frame
- Maintain steady 3-4 feet distance
- Hold poses steady for the delay duration
- Use clear, well-lit reference images

### **Troubleshooting:**
- If poses not detecting: Check distance and lighting
- If camera not working: Refresh page and allow permissions
- If model not loading: Ensure all 3 files are uploaded correctly
- If accuracy too low: Adjust threshold or improve pose form

### **Performance:**
- Works completely offline after setup
- Optimized for Windows compatibility
- Reduced frame rate for better performance
- Automatic image compression for storage

## Technical Details

- **AI Framework**: TensorFlow.js with Teachable Machine
- **Pose Detection**: PoseNet (17 keypoints)
- **Storage**: Browser LocalStorage + IndexedDB
- **Camera**: WebRTC with multiple resolution fallback
- **Compatibility**: Modern browsers with webcam support

## Development

To run locally:
```bash
python3 -m http.server 5000 --bind 0.0.0.0
```

Visit: `http://localhost:5000`

## Deployment

This app can be deployed on Replit Deployments for public access.
