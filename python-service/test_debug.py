"""
Quick debug script to see what's actually happening with the API calls
"""

import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("Debugging API Calls")
print("=" * 60)

# Test 1: Check if service is running
print("\n1. Testing service health...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    print("   → Service might not be running!")
    exit(1)

# Test 2: Check root endpoint
print("\n2. Testing root endpoint...")
try:
    response = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Model Loaded: {data.get('model_loaded')}")
    print(f"   Device: {data.get('device')}")
    if not data.get('model_loaded'):
        print("   ⚠️  WARNING: Model is not loaded!")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Try a simple generation request
print("\n3. Testing generation endpoint (with short timeout to see error)...")
try:
    payload = {
        "prompt": "a beautiful sunset",
        "width": 512,
        "height": 512,
        "num_inference_steps": 15
    }
    
    print(f"   Sending request...")
    print(f"   Payload: {json.dumps(payload, indent=2)}")
    
    # Use shorter timeout to see if it's a timeout issue
    response = requests.post(
        f"{BASE_URL}/generate",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=10  # Short timeout to see error quickly
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Success: {data.get('success')}")
        print(f"   Message: {data.get('message')}")
        print(f"   Device: {data.get('device')}")
        if data.get('image_base64'):
            print(f"   Image length: {len(data['image_base64']):,} chars")
        else:
            print(f"   ⚠️  No image_base64 in response")
    else:
        print(f"   ❌ Error Status: {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Error Response: {json.dumps(error_data, indent=2)}")
        except:
            print(f"   Error Text: {response.text[:500]}")
            
except requests.exceptions.Timeout:
    print("   ❌ TIMEOUT: Request took longer than 10 seconds")
    print("   → This is normal for CPU generation, but the test timeout might be too short")
    print("   → Try increasing timeout in test_lora.py or wait longer")
except requests.exceptions.ConnectionError:
    print("   ❌ CONNECTION ERROR: Cannot connect to service")
    print("   → Make sure the Python service is running on http://localhost:8000")
except Exception as e:
    print(f"   ❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Debug Summary")
print("=" * 60)
print("\nIf you see:")
print("  - Connection Error → Service is not running")
print("  - Timeout → Service is slow (normal on CPU), increase test timeout")
print("  - 500 Error → Check Python service logs for the actual error")
print("  - Model not loaded → Check Python service startup logs")
print("\nCheck the Python service terminal for detailed error messages!")


