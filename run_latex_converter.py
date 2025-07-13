
#!/usr/bin/env python3
import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    try:
        print("📦 Installing required packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements_latex.txt'])
        print("✅ Packages installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing packages: {e}")
        return False

def start_server():
    """Start the LaTeX converter server"""
    try:
        print("🚀 Starting LaTeX to Presentation Converter...")
        subprocess.run([sys.executable, 'latex_converter_server.py'])
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🎯 LaTeX to Presentation Converter")
    print("=" * 60)
    
    # Install requirements
    if install_requirements():
        print("\n" + "=" * 60)
        start_server()
    else:
        print("❌ Failed to install requirements. Please check your Python environment.")
        sys.exit(1)
