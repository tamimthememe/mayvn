"""
Test script for Image Generation Service
Run this to test the service independently
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to service. Is it running?")
        print("   Start the service with: python main.py")
        print("   Note: Service may still be loading the model (first run takes 5-10 minutes)")
        return False
    except requests.exceptions.Timeout:
        print("⏳ Service is taking longer than expected to respond")
        print("   This is normal if the model is still loading on first startup")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_root():
    """Test root endpoint"""
    print("\nTesting root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Check if model is loaded
        if data.get("model_loaded"):
            print("✅ Model is loaded and ready!")
        else:
            print("⏳ Model is still loading...")
            print("   This is normal on first startup (may take 5-10 minutes)")
        
        return response.status_code == 200
    except requests.exceptions.Timeout:
        print("⏳ Service is taking longer than expected")
        print("   Model may still be loading - check service logs")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_generate_image():
    """Test image generation endpoint"""
    print("\nTesting image generation...")
    try:
        payload = {
            "prompt": "a beautiful sunset over mountains with vibrant colors",
            "negative_prompt": "blurry, low-resolution, text, watermark",
            "width": 1024,
            "height": 1024,
            "num_inference_steps": 50
        }
        
        print(f"Sending request with prompt: {payload['prompt'][:50]}...")
        print("⏳ This may take 30 seconds to 5 minutes depending on your hardware...")
        print("   (GPU: ~30 seconds, CPU: 2-5 minutes)")
        
        # Set a longer timeout for image generation
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=600  # 10 minute timeout for image generation
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success')}")
            print(f"Mock: {data.get('mock')}")
            print(f"Message: {data.get('message')}")
            
            if data.get('image_base64'):
                base64_length = len(data['image_base64'])
                print(f"Image base64 length: {base64_length} characters")
                print("✅ Image generated successfully!")
            else:
                print("⚠️  No image_base64 in response")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to service. Is it running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 50)
    print("Image Generation Service - Test Suite")
    print("=" * 50)
    
    results = []
    
    # Test health check
    results.append(("Health Check", test_health()))
    
    # Test root endpoint
    results.append(("Root Endpoint", test_root()))
    
    # Test image generation
    results.append(("Image Generation", test_generate_image()))
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed")
        sys.exit(1)


if __name__ == "__main__":
    main()

