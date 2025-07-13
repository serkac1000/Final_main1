
#!/usr/bin/env python3
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, blue, red, green
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os

def create_pdf_presentation():
    # Create PDF document
    filename = "attached_assets/Pose_Recognition_Presentation.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=HexColor('#0066CC')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        textColor=HexColor('#0066CC')
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=8,
        leftIndent=20,
        bulletIndent=10
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12,
        alignment=TA_JUSTIFY
    )
    
    # Story array to hold content
    story = []
    
    # Title Page
    story.append(Paragraph("Pose Recognition Web App", title_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("AI-Powered Real-Time Pose Detection", heading_style))
    story.append(Paragraph("with Local Model Support", heading_style))
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("Replit Development Team", normal_style))
    story.append(Paragraph("July 09, 2025", normal_style))
    story.append(PageBreak())
    
    # Slide 2: What is Pose Recognition App?
    story.append(Paragraph("What is Pose Recognition App?", heading_style))
    story.append(Paragraph("• Real-time pose detection using webcam input", bullet_style))
    story.append(Paragraph("• Offline functionality - no internet required after setup", bullet_style))
    story.append(Paragraph("• Customizable settings for 1-7 poses", bullet_style))
    story.append(Paragraph("• Local model support with Teachable Machine integration", bullet_style))
    story.append(Paragraph("• Distance calibration for optimal positioning", bullet_style))
    story.append(Paragraph("• Audio feedback and visual guidance", bullet_style))
    story.append(PageBreak())
    
    # Slide 3: Core Features
    story.append(Paragraph("Core Features", heading_style))
    story.append(Paragraph("<b>Pose Recognition System:</b>", normal_style))
    story.append(Paragraph("• Support for 1-7 customizable poses", bullet_style))
    story.append(Paragraph("• Real-time confidence scoring (30-90% threshold)", bullet_style))
    story.append(Paragraph("• Visual pose comparison with reference images", bullet_style))
    story.append(Paragraph("• Skeletal tracking with 17 keypoints", bullet_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>Customization Options:</b>", normal_style))
    story.append(Paragraph("• Adjustable recognition delay (1-10 seconds)", bullet_style))
    story.append(Paragraph("• Custom pose names (editable labels)", bullet_style))
    story.append(Paragraph("• Audio beep toggle for success feedback", bullet_style))
    story.append(Paragraph("• Distance calibration with real-time guidance", bullet_style))
    story.append(PageBreak())
    
    # Slide 4: GUI Settings Interface
    story.append(Paragraph("GUI: Settings Interface", heading_style))
    story.append(Paragraph("<b>Key Features:</b>", normal_style))
    story.append(Paragraph("• Local model file uploads (model.json, metadata.json, weights.bin)", bullet_style))
    story.append(Paragraph("• Pose selection checkboxes for 1-7 poses", bullet_style))
    story.append(Paragraph("• Reference image uploads for each pose", bullet_style))
    story.append(Paragraph("• Audio, delay, and accuracy threshold controls", bullet_style))
    story.append(Paragraph("• Distance calibration guide", bullet_style))
    
    # Try to add image if it exists
    if os.path.exists("attached_assets/GUI1_1752049448296.png"):
        try:
            story.append(Spacer(1, 0.2*inch))
            story.append(Image("attached_assets/GUI1_1752049448296.png", width=6*inch, height=3*inch))
        except:
            pass
    story.append(PageBreak())
    
    # Slide 5: GUI Recognition Interface
    story.append(Paragraph("GUI: Recognition Interface", heading_style))
    story.append(Paragraph("<b>Real-time Features:</b>", normal_style))
    story.append(Paragraph("• Live webcam feed with pose detection", bullet_style))
    story.append(Paragraph("• Current vs Expected pose display", bullet_style))
    story.append(Paragraph("• Confidence bar with color coding (green = correct, red = incorrect)", bullet_style))
    story.append(Paragraph("• Reference image comparison", bullet_style))
    story.append(Paragraph("• Refresh and back to settings controls", bullet_style))
    
    # Try to add image if it exists
    if os.path.exists("attached_assets/GUI2_1752049449853.png"):
        try:
            story.append(Spacer(1, 0.2*inch))
            story.append(Image("attached_assets/GUI2_1752049449853.png", width=6*inch, height=3*inch))
        except:
            pass
    story.append(PageBreak())
    
    # Slide 6: Technical Specifications
    story.append(Paragraph("Technical Specifications", heading_style))
    story.append(Paragraph("<b>AI Framework:</b>", normal_style))
    story.append(Paragraph("• TensorFlow.js with Teachable Machine models", bullet_style))
    story.append(Paragraph("• PoseNet for 17-keypoint skeletal tracking", bullet_style))
    story.append(Paragraph("• Local storage with IndexedDB for offline use", bullet_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>Compatibility:</b>", normal_style))
    story.append(Paragraph("• Modern browsers with WebRTC support", bullet_style))
    story.append(Paragraph("• Optimized for Windows compatibility", bullet_style))
    story.append(Paragraph("• Automatic image compression for storage", bullet_style))
    story.append(Paragraph("• Multiple camera resolution fallback", bullet_style))
    story.append(PageBreak())
    
    # Slide 7: Easy Setup Process
    story.append(Paragraph("Easy Setup Process", heading_style))
    story.append(Paragraph("1. <b>Train Your Model:</b> Use Teachable Machine to create pose model", normal_style))
    story.append(Paragraph("2. <b>Upload Files:</b> Import model.json, metadata.json, weights.bin", normal_style))
    story.append(Paragraph("3. <b>Configure Poses:</b> Select 1-7 poses and upload reference images", normal_style))
    story.append(Paragraph("4. <b>Adjust Settings:</b> Set audio, delay, and accuracy preferences", normal_style))
    story.append(Paragraph("5. <b>Start Recognition:</b> Begin real-time pose detection", normal_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<font color='red'><b>Fully Offline:</b> Works completely without internet after initial setup</font>", normal_style))
    story.append(PageBreak())
    
    # Slide 8: Advanced Features
    story.append(Paragraph("Advanced Features", heading_style))
    story.append(Paragraph("<b>Distance Calibration:</b>", normal_style))
    story.append(Paragraph("• Auto-detection of user distance from camera", bullet_style))
    story.append(Paragraph("• Real-time feedback for optimal positioning (3-4 feet)", bullet_style))
    story.append(Paragraph("• Visual cues: Green = perfect, Red = adjust distance", bullet_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>Data Management:</b>", normal_style))
    story.append(Paragraph("• Save all settings and model files locally", bullet_style))
    story.append(Paragraph("• Clear memory function with confirmation", bullet_style))
    story.append(Paragraph("• Auto-save for pose selections and custom names", bullet_style))
    story.append(Paragraph("• Persistent settings across browser sessions", bullet_style))
    story.append(PageBreak())
    
    # Slide 9: Use Cases
    story.append(Paragraph("Use Cases", heading_style))
    story.append(Paragraph("• <b>Fitness Training:</b> Monitor exercise form and technique", bullet_style))
    story.append(Paragraph("• <b>Yoga Practice:</b> Guide through pose sequences with feedback", bullet_style))
    story.append(Paragraph("• <b>Physical Therapy:</b> Track rehabilitation exercises", bullet_style))
    story.append(Paragraph("• <b>Sports Coaching:</b> Analyze athletic movements", bullet_style))
    story.append(Paragraph("• <b>Education:</b> Teach proper posture and movement", bullet_style))
    story.append(Paragraph("• <b>Accessibility:</b> Assistive technology for movement training", bullet_style))
    story.append(PageBreak())
    
    # Slide 10: Key Benefits
    story.append(Paragraph("Key Benefits", heading_style))
    story.append(Paragraph("<b>Privacy & Security:</b>", normal_style))
    story.append(Paragraph("• No data sent to external servers", bullet_style))
    story.append(Paragraph("• Local processing ensures privacy", bullet_style))
    story.append(Paragraph("• Offline functionality protects user data", bullet_style))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>User Experience:</b>", normal_style))
    story.append(Paragraph("• Instant feedback with audio and visual cues", bullet_style))
    story.append(Paragraph("• Customizable difficulty and timing", bullet_style))
    story.append(Paragraph("• Clear progress tracking through pose sequences", bullet_style))
    story.append(PageBreak())
    
    # Slide 11: Get Started Today!
    story.append(Paragraph("Get Started Today!", heading_style))
    story.append(Paragraph("<b>Transform your training experience with Pose Recognition Web App</b>", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("✓ <b>Available on Replit:</b> Easy deployment and sharing", normal_style))
    story.append(Paragraph("✓ <b>Open Source:</b> Customizable for your needs", normal_style))
    story.append(Paragraph("✓ <b>No Installation:</b> Run directly in your browser", normal_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<b>Ready to Use:</b>", normal_style))
    story.append(Paragraph("• Deploy instantly on Replit", bullet_style))
    story.append(Paragraph("• Share with your team or students", bullet_style))
    story.append(Paragraph("• Customize for specific use cases", bullet_style))
    
    # Build PDF
    doc.build(story)
    print(f"✅ PDF presentation created successfully!")
    print(f"📄 PDF file saved: {filename}")
    print(f"🖥️ Ready for Windows environment viewing!")
    
    return filename

if __name__ == "__main__":
    create_pdf_presentation()
