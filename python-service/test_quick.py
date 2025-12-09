"""
Quick test script - tests endpoints separately with better feedback
"""

import requests
import json
import time
import base64
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint"""
    print("=" * 60)
    print("1. Testing Health Check Endpoint")
    print("=" * 60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_root():
    """Test root endpoint to check model status"""
    print("\n" + "=" * 60)
    print("2. Testing Root Endpoint (Model Status)")
    print("=" * 60)
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        data = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Service: {data.get('service')}")
        print(f"✅ Status: {data.get('status')}")
        print(f"✅ Phase: {data.get('phase')}")
        print(f"✅ Model Loaded: {data.get('model_loaded')}")
        print(f"✅ Device: {data.get('device')}")
        
        if data.get('model_loaded'):
            print("\n🎉 Model is loaded and ready for image generation!")
        else:
            print("\n⏳ Model is still loading...")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_generate_image_quick():
    """Test image generation with fewer steps for faster testing"""
    print("\n" + "=" * 60)
    print("3. Testing Image Generation (Quick Test - 15 steps)")
    print("=" * 60)
    print("⚠️  Note: This will take 5-15 minutes on CPU, 10-30 seconds on GPU")
    print("   The progress bar will show in the service terminal\n")
    
    try:
        payload = {
            "prompt": "a beautiful sunset over mountains",
            "negative_prompt": "blurry, low-resolution, text, watermark",
            "width": 512,  # Smaller for faster generation
            "height": 512,  # Smaller for faster generation
            "num_inference_steps": 15  # Fewer steps for faster testing
        }
        
        print(f"📤 Sending request...")
        print(f"   Prompt: {payload['prompt']}")
        print(f"   Dimensions: {payload['width']}x{payload['height']}")
        print(f"   Steps: {payload['num_inference_steps']}")
        print(f"\n⏳ Generating image (this may take a while on CPU)...")
        print(f"   Watch the service terminal for progress bar\n")
        
        start_time = time.time()
        
        # Extended timeout for CPU generation (30 minutes)
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=1800  # 30 minute timeout for CPU
        )
        
        elapsed_time = time.time() - start_time
        
        print(f"✅ Request completed in {elapsed_time:.1f} seconds")
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            print(f"✅ Mock: {data.get('mock')}")
            print(f"✅ Device: {data.get('device')}")
            print(f"✅ Message: {data.get('message')}")
            
            if data.get('image_base64'):
                base64_length = len(data['image_base64'])
                print(f"✅ Image base64 length: {base64_length:,} characters")
                
                # Decode and save the image
                try:
                    # Strip data URI prefix if present (format: data:image/png;base64,{base64_string})
                    base64_string = data['image_base64']
                    if base64_string.startswith('data:image'):
                        # Extract just the base64 part after the comma
                        base64_string = base64_string.split(',', 1)[1]
                    
                    # Decode base64 and save
                    image_data = base64.b64decode(base64_string)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"generated_image_{timestamp}.png"
                    with open(filename, 'wb') as f:
                        f.write(image_data)
                    print(f"\n🎉 Image generated successfully!")
                    print(f"   Image saved as: {filename}")
                    return True
                except Exception as e:
                    print(f"\n🎉 Image generated successfully!")
                    print(f"   ⚠️  Error saving image: {e}")
                    print(f"   You can decode the base64 to see the image")
                    return True
            else:
                print("⚠️  No image_base64 in response")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 minutes")
        print("   This might mean:")
        print("   - CPU generation is extremely slow")
        print("   - Try reducing steps (e.g., 10 steps) or dimensions (e.g., 256x256)")
        print("   - Consider using GPU if available")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run tests"""
    print("\n" + "=" * 60)
    print("Image Generation Service - Quick Test Suite")
    print("=" * 60)
    print()
    
    # Test 1: Health check
    health_ok = test_health()
    time.sleep(1)
    
    # Test 2: Root endpoint
    root_ok = test_root()
    time.sleep(1)
    
    # Test 3: Image generation (only if model is loaded)
    if root_ok:
        print("\n" + "=" * 60)
        response = input("Proceed with image generation test? (y/n): ")
        if response.lower() == 'y':
            generate_ok = test_generate_image_quick()
        else:
            print("Skipping image generation test")
            generate_ok = None
    else:
        generate_ok = None
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Root Endpoint: {'✅ PASS' if root_ok else '❌ FAIL'}")
    if generate_ok is not None:
        print(f"Image Generation: {'✅ PASS' if generate_ok else '❌ FAIL'}")
    else:
        print(f"Image Generation: ⏭️  SKIPPED")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()



