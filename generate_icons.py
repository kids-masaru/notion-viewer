import os
from PIL import Image

# Source image path
source_path = r"C:/Users/700289/.gemini/antigravity/brain/bd161b95-6e00-4e6d-8a26-7cedad4bd287/uploaded_image_1764507262892.jpg"
# Target directory
public_dir = r"c:/Users/700289/Downloads/Python/notion-viewer/public"

if not os.path.exists(public_dir):
    os.makedirs(public_dir)

try:
    img = Image.open(source_path)
    
    # Generate 192x192
    icon192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    icon192.save(os.path.join(public_dir, "icon-192.png"))
    print("Created icon-192.png")
    
    # Generate 512x512
    icon512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon512.save(os.path.join(public_dir, "icon-512.png"))
    print("Created icon-512.png")
    
    # Also save as apple-touch-icon (usually 180x180 or 192x192 is fine)
    apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(public_dir, "apple-touch-icon.png"))
    print("Created apple-touch-icon.png")

except Exception as e:
    print(f"Error: {e}")
