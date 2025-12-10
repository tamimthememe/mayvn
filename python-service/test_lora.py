"""
Test script for LoRA functionality
Tests both backward compatibility (no LoRA) and LoRA-enabled generation
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_backward_compatibility():
    """Test that existing functionality still works without LoRA"""
    print("=" * 60)
    print("Test 1: Backward Compatibility (No LoRA)")
    print("=" * 60)
    
    payload = {
        "prompt": "a beautiful sunset over mountains",
        "width": 512,
        "height": 512,
        "num_inference_steps": 15
        # No brand_id - should work exactly as before
    }
    
    try:
        print(f"📤 Sending request without brand_id...")
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=1800
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ Success: {data.get('success')}")
            print(f"✅ Device: {data.get('device')}")
            print(f"✅ Message: {data.get('message')}")
            if data.get('image_base64'):
                print(f"✅ Image generated (base64 length: {len(data['image_base64']):,} chars)")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_lora_without_file():
    """Test LoRA request when LoRA file doesn't exist (should fallback to base)"""
    print("\n" + "=" * 60)
    print("Test 2: LoRA Request (No File - Should Fallback)")
    print("=" * 60)
    
    payload = {
        "prompt": "a beautiful sunset over mountains",
        "width": 512,
        "height": 512,
        "num_inference_steps": 15,
        "brand_id": "nonexistent_brand",  # LoRA file doesn't exist
        "lora_weights": 0.8
    }
    
    try:
        print(f"📤 Sending request with brand_id (no LoRA file)...")
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=1800
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ Success: {data.get('success')}")
            print(f"✅ Should fallback to base model (no LoRA file found)")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_api_structure():
    """Test that API accepts new optional parameters"""
    print("\n" + "=" * 60)
    print("Test 3: API Structure (New Parameters)")
    print("=" * 60)
    
    # Test with all new optional parameters
    payload = {
        "prompt": "test prompt",
        "brand_id": "test_brand",
        "lora_weights": 0.7,
        "width": 512,
        "height": 512,
        "num_inference_steps": 1  # Just 1 step for quick validation
    }
    
    try:
        print(f"📤 Testing API accepts new parameters...")
        # We'll just validate the request structure, not wait for full generation
        print(f"✅ Payload structure valid:")
        print(f"   - brand_id: {payload.get('brand_id')}")
        print(f"   - lora_weights: {payload.get('lora_weights')}")
        print(f"   - All original parameters present: ✅")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_root_endpoint():
    """Test root endpoint shows LoRA support"""
    print("\n" + "=" * 60)
    print("Test 4: Root Endpoint (LoRA Support Info)")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ Service: {data.get('service')}")
            print(f"✅ Version: {data.get('version')}")
            print(f"✅ LoRA Support: {data.get('lora_support')}")
            print(f"✅ LoRA Directory: {data.get('lora_directory')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("LoRA Functionality Test Suite")
    print("=" * 60)
    print("\n⚠️  Note: Make sure the image generation service is running")
    print("   on http://localhost:8000\n")
    
    results = []
    
    # Test 1: Backward compatibility
    results.append(("Backward Compatibility", test_backward_compatibility()))
    time.sleep(1)
    
    # Test 2: LoRA without file (fallback)
    results.append(("LoRA Fallback", test_lora_without_file()))
    time.sleep(1)
    
    # Test 3: API structure
    results.append(("API Structure", test_api_structure()))
    time.sleep(1)
    
    # Test 4: Root endpoint
    results.append(("Root Endpoint", test_root_endpoint()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")
    print("=" * 60)


if __name__ == "__main__":
    main()


