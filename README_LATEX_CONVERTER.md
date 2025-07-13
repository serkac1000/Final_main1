
# 🎯 LaTeX to Presentation Converter

A standalone web application that converts LaTeX code into beautiful PowerPoint (.pptx) or PDF presentations with support for English and Russian languages.

## 🚀 Features

- **LaTeX Input**: Paste your LaTeX beamer code directly into the web interface
- **Multi-Language Support**: Generate presentations in English or Russian
- **Multiple Formats**: Export as PowerPoint (.pptx) or PDF documents
- **Automatic Parsing**: Intelligently extracts titles, slides, and bullet points
- **Real-time Conversion**: Fast server-side processing
- **Clean Interface**: Modern, responsive web design
- **File Download**: Automatic download of generated presentations

## 📋 Supported LaTeX Elements

The converter recognizes and processes:
- `\title{}` - Document title
- `\author{}` - Author information
- `\begin{frame}{Title}` - Slide creation with titles
- `\begin{itemize}` and `\item` - Bullet point lists
- Regular text content within frames

## 🛠️ Quick Start

### Method 1: Direct Launch
```bash
python3 run_latex_converter.py
```

### Method 2: Manual Setup
```bash
# Install dependencies
pip install -r requirements_latex.txt

# Start the server
python3 latex_converter_server.py
```

## 🌐 Usage

1. **Access the App**: Open your browser to `http://localhost:5000`
2. **Input LaTeX**: Paste your LaTeX beamer code in the text area
3. **Select Options**:
   - Choose language: English or Russian
   - Choose format: PowerPoint (.pptx) or PDF
4. **Convert**: Click "Convert LaTeX to Presentation"
5. **Download**: Your presentation will be automatically downloaded

## 📝 Example LaTeX Input

```latex
\documentclass{beamer}
\title{My Research Presentation}
\author{Dr. John Smith}

\begin{document}

\begin{frame}{Introduction}
\begin{itemize}
\item Welcome to our research
\item Key objectives outlined
\item Methodology overview
\end{itemize}
\end{frame}

\begin{frame}{Results}
\begin{itemize}
\item Significant findings
\item Data analysis complete
\item Statistical validation
\end{itemize}
\end{frame}

\begin{frame}{Conclusion}
Thank you for your attention.
Questions and discussion welcome.
\end{frame}

\end{document}
```

## 🔧 Technical Details

- **Backend**: Python Flask server
- **Frontend**: HTML5, CSS3, JavaScript
- **LaTeX Processing**: Custom parser for beamer documents
- **PPTX Generation**: python-pptx library
- **PDF Generation**: ReportLab library
- **File Management**: Temporary file handling with auto-cleanup

## 📁 File Structure

```
latex-converter-app/
├── latex_converter.html          # Main web interface
├── latex_converter.js            # Frontend JavaScript
├── latex_converter_server.py     # Flask backend server
├── run_latex_converter.py        # Launcher script
├── requirements_latex.txt        # Python dependencies
├── temp_files/                   # Generated presentations
└── README_LATEX_CONVERTER.md     # This documentation
```

## 🌍 Language Support

### English Output
- Standard English presentation layout
- Professional formatting
- Western typography

### Russian Output (Русский)
- Cyrillic character support
- Russian language formatting
- Localized presentation structure

## 🔒 Security Features

- File size limits (16MB max)
- Secure filename handling
- Automatic cleanup of temporary files
- Input validation and sanitization

## 🛠️ API Endpoints

- `GET /` - Main web interface
- `POST /convert` - LaTeX conversion endpoint
- `GET /download/<filename>` - File download
- `GET /cleanup` - Manual cleanup of temp files

## 🎨 Customization

The application can be easily customized:
- Modify presentation templates in the converter class
- Add new language support
- Extend LaTeX element recognition
- Customize output formatting

## 🚨 Troubleshooting

### Common Issues:
1. **Dependencies not installed**: Run `pip install -r requirements_latex.txt`
2. **Port already in use**: Change port in `latex_converter_server.py`
3. **LaTeX not recognized**: Check your LaTeX syntax matches supported elements
4. **File not downloading**: Check browser download settings

### Debug Mode:
The server runs in debug mode by default. Check console output for detailed error messages.

## 📊 Performance

- **Conversion Speed**: ~1-3 seconds for typical presentations
- **File Size**: Generated files typically 50KB-2MB
- **Concurrent Users**: Supports multiple simultaneous conversions
- **Memory Usage**: Minimal server memory footprint

## 🔄 Updates

This standalone application is designed to be:
- Self-contained and portable
- Easy to modify and extend
- Compatible with standard Python environments
- Ready for deployment on various platforms

---

**Developed for Replit Environment** 🚀
Ready to deploy and share instantly!
