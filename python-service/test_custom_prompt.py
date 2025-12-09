"""
Custom Prompt Tester - Generate images with your own prompts
"""

import requests
import base64
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def generate_image(prompt, negative_prompt=None, width=512, height=512, steps=15):
    """
    Generate an image with a custom prompt
    
    Args:
        prompt: The main prompt describing what to generate
        negative_prompt: Things to avoid in the image
        width: Image width (default 512)
        height: Image height (default 512)
        steps: Number of inference steps (default 15)
    """
    print("=" * 60)
    print("Custom Image Generation")
    print("=" * 60)
    print(f"\n📝 Prompt: {prompt}")
    if negative_prompt:
        print(f"🚫 Negative Prompt: {negative_prompt}")
    print(f"📐 Dimensions: {width}x{height}")
    print(f"🔄 Steps: {steps}")
    print(f"\n⚠️  Note: This will take 5-15 minutes on CPU, 10-30 seconds on GPU")
    print("   The progress bar will show in the service terminal\n")
    
    # Default negative prompt for marketing posts
    if negative_prompt is None:
        negative_prompt = "blurry, low-resolution, distorted, text, watermark, logo, brand mark, signature, ugly, bad quality"
    
    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "width": width,
        "height": height,
        "num_inference_steps": steps
    }
    
    try:
        print("📤 Sending request to API...")
        print("⏳ Generating image (this may take a while on CPU)...\n")
        
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=1800  # 30 minute timeout
        )
        
        elapsed_time = time.time() - start_time
        
        print(f"✅ Request completed in {elapsed_time:.1f} seconds")
        print(f"✅ Status: {response.status_code}\n")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and data.get('image_base64'):
                # Decode and save the image
                try:
                    base64_string = data['image_base64']
                    if base64_string.startswith('data:image'):
                        base64_string = base64_string.split(',', 1)[1]
                    
                    image_data = base64.b64decode(base64_string)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    
                    # Create a safe filename from the prompt (first few words)
                    safe_prompt = "".join(c for c in prompt[:30] if c.isalnum() or c in (' ', '-', '_')).strip()
                    safe_prompt = safe_prompt.replace(' ', '_')
                    filename = f"generated_{safe_prompt}_{timestamp}.png"
                    
                    with open(filename, 'wb') as f:
                        f.write(image_data)
                    
                    print("=" * 60)
                    print("🎉 Image generated successfully!")
                    print("=" * 60)
                    print(f"📁 Image saved as: {filename}")
                    print(f"🖼️  Device: {data.get('device', 'unknown')}")
                    print(f"✅ Success: {data.get('success')}")
                    return True
                except Exception as e:
                    print(f"❌ Error saving image: {e}")
                    return False
            else:
                print(f"❌ Generation failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 minutes")
        print("   Try reducing steps or dimensions")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("Custom Prompt Image Generator")
    print("=" * 60)
    print()
    
    # Check if prompt is provided as command-line argument
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        # Interactive mode
        print("Enter your prompt (or press Enter for example):")
        prompt = input("> ").strip()
        
        if not prompt:
            # Example prompt for croissant marketing post
            prompt = "professional marketing photo of a golden buttery croissant on a white plate, soft natural lighting, appetizing, food photography, high quality, commercial product shot, minimalist background"
            print(f"\n📝 Using example prompt: {prompt}\n")
    
    # Optional: Ask for custom settings
    print("\nUse default settings? (512x512, 15 steps) [Y/n]: ", end="")
    use_defaults = input().strip().lower()
    
    if use_defaults and use_defaults != 'n':
        width, height, steps = 512, 512, 15
    else:
        try:
            width = int(input("Width (default 512): ") or "512")
            height = int(input("Height (default 512): ") or "512")
            steps = int(input("Steps (default 15): ") or "15")
        except ValueError:
            print("Invalid input, using defaults")
            width, height, steps = 512, 512, 15
    
    # Generate the image
    success = generate_image(prompt, width=width, height=height, steps=steps)
    
    if success:
        print("\n✨ Done!")
    else:
        print("\n❌ Failed to generate image")


if __name__ == "__main__":
    main()

