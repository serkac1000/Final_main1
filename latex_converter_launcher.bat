
@echo off
title LaTeX to Presentation Converter
echo Starting LaTeX to Presentation Converter...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH!
    echo Please install Python and try again.
    pause
    exit /b 1
)

REM Install required packages
echo Installing required packages...
pip install python-pptx reportlab pillow --quiet

REM Check if main app exists
if not exist "latex_converter_app.py" (
    echo latex_converter_app.py not found!
    echo Please make sure you're in the correct directory.
    pause
    exit /b 1
)

REM Launch the application
echo Launching LaTeX Converter...
python latex_converter_app.py

pause
