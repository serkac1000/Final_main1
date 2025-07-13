
#!/usr/bin/env python3
import tkinter as tk
from tkinter import messagebox, ttk
import subprocess
import sys
import os

def create_presentation_gui():
    # Create main window
    root = tk.Tk()
    root.title("Pose Recognition Presentation Launcher")
    root.geometry("500x400")
    root.configure(bg='#f0f0f0')
    
    # Create header
    header_frame = tk.Frame(root, bg='#0066CC', height=80)
    header_frame.pack(fill='x')
    header_frame.pack_propagate(False)
    
    title_label = tk.Label(header_frame, 
                          text="POSE RECOGNITION WEB APP", 
                          font=('Arial', 16, 'bold'), 
                          fg='white', 
                          bg='#0066CC')
    title_label.pack(pady=20)
    
    # Create main content frame
    content_frame = tk.Frame(root, bg='#f0f0f0')
    content_frame.pack(expand=True, fill='both', padx=20, pady=20)
    
    # Language selection
    lang_label = tk.Label(content_frame, 
                         text="Choose Presentation Language:", 
                         font=('Arial', 12, 'bold'), 
                         bg='#f0f0f0')
    lang_label.pack(pady=(0, 10))
    
    # Language variable
    language_var = tk.StringVar(value="english")
    
    # English option
    english_frame = tk.Frame(content_frame, bg='#f0f0f0')
    english_frame.pack(fill='x', pady=5)
    
    english_radio = tk.Radiobutton(english_frame, 
                                  text="🇺🇸 English", 
                                  variable=language_var, 
                                  value="english",
                                  font=('Arial', 11),
                                  bg='#f0f0f0')
    english_radio.pack(anchor='w')
    
    english_desc = tk.Label(english_frame, 
                           text="AI-Powered Real-Time Pose Detection with Local Model Support", 
                           font=('Arial', 9), 
                           fg='gray', 
                           bg='#f0f0f0')
    english_desc.pack(anchor='w', padx=20)
    
    # Russian option
    russian_frame = tk.Frame(content_frame, bg='#f0f0f0')
    russian_frame.pack(fill='x', pady=5)
    
    russian_radio = tk.Radiobutton(russian_frame, 
                                  text="🇷🇺 Русский", 
                                  variable=language_var, 
                                  value="russian",
                                  font=('Arial', 11),
                                  bg='#f0f0f0')
    russian_radio.pack(anchor='w')
    
    russian_desc = tk.Label(russian_frame, 
                           text="ИИ-система распознавания поз в реальном времени с поддержкой локальных моделей", 
                           font=('Arial', 9), 
                           fg='gray', 
                           bg='#f0f0f0')
    russian_desc.pack(anchor='w', padx=20)
    
    # Presentation format selection
    format_label = tk.Label(content_frame, 
                           text="Choose Presentation Format:", 
                           font=('Arial', 12, 'bold'), 
                           bg='#f0f0f0')
    format_label.pack(pady=(20, 10))
    
    format_var = tk.StringVar(value="pptx")
    
    pptx_radio = tk.Radiobutton(content_frame, 
                               text="📊 PowerPoint (.pptx) - Recommended", 
                               variable=format_var, 
                               value="pptx",
                               font=('Arial', 11),
                               bg='#f0f0f0')
    pptx_radio.pack(anchor='w')
    
    pdf_radio = tk.Radiobutton(content_frame, 
                              text="📄 PDF Document (.pdf)", 
                              variable=format_var, 
                              value="pdf",
                              font=('Arial', 11),
                              bg='#f0f0f0')
    pdf_radio.pack(anchor='w')
    
    # Status label
    status_label = tk.Label(content_frame, 
                           text="Ready to create presentation...", 
                           font=('Arial', 9), 
                           fg='green', 
                           bg='#f0f0f0')
    status_label.pack(pady=(20, 0))
    
    # Progress bar
    progress = ttk.Progressbar(content_frame, mode='indeterminate')
    progress.pack(fill='x', pady=10)
    
    def create_presentation():
        try:
            language = language_var.get()
            format_type = format_var.get()
            
            status_label.config(text="Creating presentation...", fg='blue')
            progress.start()
            root.update()
            
            if language == "english":
                if format_type == "pptx":
                    script_name = "create_pptx_presentation.py"
                    output_file = "attached_assets/Pose_Recognition_Presentation.pptx"
                else:
                    script_name = "create_pdf_presentation.py"
                    output_file = "attached_assets/Pose_Recognition_Presentation.pdf"
            else:  # russian
                if format_type == "pptx":
                    script_name = "create_pptx_presentation_russian.py"
                    output_file = "attached_assets/Pose_Recognition_Presentation_Russian.pptx"
                else:
                    script_name = "create_pdf_presentation_russian.py"
                    output_file = "attached_assets/Pose_Recognition_Presentation_Russian.pdf"
            
            # Run the presentation creation script
            result = subprocess.run([sys.executable, script_name], 
                                  capture_output=True, text=True)
            
            progress.stop()
            
            if result.returncode == 0:
                status_label.config(text="Presentation created successfully!", fg='green')
                
                # Try to open the presentation
                if os.path.exists(output_file):
                    try:
                        if os.name == 'nt':  # Windows
                            os.startfile(output_file)
                        else:  # macOS and Linux
                            subprocess.run(['open' if sys.platform == 'darwin' else 'xdg-open', output_file])
                        
                        messagebox.showinfo("Success", 
                                          f"Presentation created and opened!\n\nFile: {output_file}")
                    except Exception as e:
                        messagebox.showinfo("Success", 
                                          f"Presentation created successfully!\n\nFile: {output_file}\n\nPlease open it manually.")
                else:
                    messagebox.showwarning("Warning", 
                                         "Presentation script completed but file not found.")
            else:
                status_label.config(text="Error creating presentation", fg='red')
                messagebox.showerror("Error", 
                                   f"Failed to create presentation:\n{result.stderr}")
                
        except Exception as e:
            progress.stop()
            status_label.config(text="Error occurred", fg='red')
            messagebox.showerror("Error", f"An error occurred: {str(e)}")
    
    # Create presentation button
    create_button = tk.Button(content_frame, 
                             text="🚀 Create & Open Presentation", 
                             command=create_presentation,
                             font=('Arial', 12, 'bold'),
                             bg='#0066CC',
                             fg='white',
                             padx=20,
                             pady=10)
    create_button.pack(pady=20)
    
    # Exit button
    exit_button = tk.Button(content_frame, 
                           text="❌ Exit", 
                           command=root.quit,
                           font=('Arial', 10),
                           bg='#dc3545',
                           fg='white',
                           padx=15,
                           pady=5)
    exit_button.pack()
    
    # Center the window
    root.update_idletasks()
    x = (root.winfo_screenwidth() // 2) - (root.winfo_width() // 2)
    y = (root.winfo_screenheight() // 2) - (root.winfo_height() // 2)
    root.geometry(f"+{x}+{y}")
    
    # Start the GUI
    root.mainloop()

if __name__ == "__main__":
    create_presentation_gui()
