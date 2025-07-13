
# 📄 LaTeX to Presentation Converter

A standalone GUI application that converts LaTeX (.tex) files into PowerPoint (.pptx) or PDF presentations with support for images and videos.

## 🚀 Features

- **LaTeX Parsing**: Automatically extracts titles, sections, subsections, and bullet points from .tex files
- **Multi-language Support**: English and Russian output
- **Multiple Formats**: Generate PowerPoint (.pptx) or PDF presentations
- **Media Integration**: Add images and videos to enhance presentations
- **User-friendly GUI**: Easy-to-use interface with file browsers and drag-drop support
- **Cross-platform**: Works on Windows, macOS, and Linux

## 📋 Requirements

- Python 3.7 or higher
- Required packages (automatically installed):
  - python-pptx
  - reportlab
  - Pillow
  - tkinter (usually included with Python)

## 🛠️ Installation & Usage

### Windows (Easy Start)
1. Double-click `latex_converter_launcher.bat`
2. The script will automatically install dependencies and launch the app

### Manual Installation
```bash
# Install dependencies
pip install -r latex_requirements.txt

# Run the application
python latex_converter_app.py
```

## 🎯 How to Use

1. **Select LaTeX File**: Click "Browse" to select your .tex file
2. **Add Media Files**: 
   - Click "📸 Add Images" to add image files (PNG, JPG, etc.)
   - Click "🎥 Add Videos" to add video files (MP4, AVI, etc.)
3. **Choose Language**: Select English or Russian output
4. **Select Format**: Choose PowerPoint (.pptx) or PDF output
5. **Convert**: Click "🚀 Convert to Presentation"

## 📝 LaTeX File Format

The converter recognizes standard LaTeX structures:

```latex
\documentclass{article}
\title{Your Presentation Title}
\begin{document}

\section{Section Name}
\subsection{Slide Title}
\begin{itemize}
    \item First bullet point
    \item Second bullet point
    \item Third bullet point
\end{itemize}

\subsection{Another Slide}
Your content here...

\end{document}
```

## 🎨 Features

- **Smart Content Extraction**: Automatically finds and formats content
- **Media Integration**: Images are automatically embedded in slides
- **Professional Styling**: Clean, professional presentation templates
- **Error Handling**: Comprehensive error messages and validation
- **Progress Tracking**: Real-time conversion progress

## 📁 Output

Generated presentations are saved in the `output_presentations/` directory with:
- Descriptive filenames including language suffix
- Embedded media files in `media/` subdirectory
- Automatic file opening after conversion

## 🔧 Troubleshooting

### Common Issues:
1. **"python-pptx not found"**: Run `pip install python-pptx`
2. **"File not found"**: Ensure the LaTeX file path is correct
3. **"Media not displaying"**: Check that image/video files exist and are in supported formats

### Supported File Formats:
- **LaTeX**: .tex
- **Images**: .png, .jpg, .jpeg, .gif, .bmp, .tiff
- **Videos**: .mp4, .avi, .mov, .wmv, .flv, .mkv

## 📞 Support

This is a standalone application developed for converting LaTeX documents to presentations with media support. For issues or feature requests, check the main repository documentation.
