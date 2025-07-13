
#!/usr/bin/env python3
import subprocess
import os
import sys

def compile_latex():
    tex_file = "attached_assets/AI_Trainer_Presentation_English_Final_1752049436735.tex"
    
    if not os.path.exists(tex_file):
        print(f"Error: {tex_file} not found!")
        return False
    
    # Change to the directory containing the tex file
    original_dir = os.getcwd()
    tex_dir = os.path.dirname(tex_file)
    tex_filename = os.path.basename(tex_file)
    
    try:
        os.chdir(tex_dir)
        
        # Compile with pdflatex
        result = subprocess.run(['pdflatex', tex_filename], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            pdf_name = tex_filename.replace('.tex', '.pdf')
            print(f"✅ Presentation compiled successfully!")
            print(f"📄 PDF created: {os.path.join(tex_dir, pdf_name)}")
            return True
        else:
            print("❌ Compilation failed:")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except FileNotFoundError:
        print("❌ pdflatex not found. Installing LaTeX...")
        return False
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    compile_latex()
