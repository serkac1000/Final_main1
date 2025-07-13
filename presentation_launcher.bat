
@echo off
title Pose Recognition Presentation Launcher
color 0A

echo ========================================
echo   POSE RECOGNITION PRESENTATION
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

echo Installing required packages for presentation...
pip install python-pptx reportlab tkinter >nul 2>&1
if errorlevel 1 (
    echo Trying with pip3...
    pip3 install python-pptx reportlab >nul 2>&1
)

echo.
echo Starting Presentation GUI Launcher...
echo.

REM Launch the Python GUI
python launch_presentation.py

echo.
echo Presentation launcher completed.
echo Press any key to exit...
pause >nul
