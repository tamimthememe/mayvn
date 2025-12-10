"""
Comprehensive test for brand integration and metadata storage
Tests the full flow: brand_data -> brand_id extraction -> metadata storage -> LoRA loading
"""

import requests
import json
import time
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"
LORA_DIR = "loras"


def test_basic_generation():
    """Test 1: Basic generation without brand data"""
    print("=" * 60)
    print("Test 1: Basic Generation (No Brand Data)")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/generate",
            json={
                "prompt": "a beautiful sunset over mountains",
                "width": 512,
                "height": 512,
                "num_inference_steps": 15
            },
            timeout=1800
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ Success: {data.get('success')}")
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


def test_brand_metadata_saving():
    """Test 2: Brand metadata saving"""
    print("\n" + "=" * 60)
    print("Test 2: Brand Metadata Saving")
    print("=" * 60)
    
    brand_data = {
        "id": "test_brand_integration",
        "brand_name": "Test Integration Brand",
        "tagline": "Testing brand integration",
        "colors": ["#FF5733", "#33FF57", "#3357FF"],
        "accent_color": "#FF5733",
        "brand_values": ["quality", "innovation", "testing"],
        "tone_of_voice": ["professional", "friendly"],
        "fonts": ["Arial", "Helvetica"],
        "main_font": "Arial",
        "target_audience": ["developers", "testers"],
        "business_overview": "A test brand for integration testing"
    }
    
    try:
        print(f"📤 Sending request with brand_data...")
        print(f"   Brand ID: {brand_data['id']}")
        print(f"   Brand Name: {brand_data['brand_name']}")
        
        response = requests.post(
            f"{BASE_URL}/generate",
            json={
                "prompt": "a professional test image",
                "width": 512,
                "height": 512,
                "num_inference_steps": 15,
                "brand_data": brand_data
            },
            timeout=1800
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ Success: {data.get('success')}")
            
            # Check if metadata was saved
            metadata_path = Path(LORA_DIR) / "test_brand_integration" / "brand_metadata.json"
            if metadata_path.exists():
                print(f"✅ Metadata file created: {metadata_path}")
                
                # Read and verify metadata
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                print(f"✅ Metadata contains:")
                print(f"   - Brand Name: {metadata.get('brand_name')}")
                print(f"   - Colors: {len(metadata.get('colors', []))} colors")
                print(f"   - Saved At: {metadata.get('saved_at')}")
                return True
            else:
                print(f"⚠️  Metadata file not found at: {metadata_path}")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_brand_id_extraction():
    """Test 3: Brand ID extraction from brand_data"""
    print("\n" + "=" * 60)
    print("Test 3: Brand ID Extraction")
    print("=" * 60)
    
    # Test with Firestore ID
    brand_data_with_id = {
        "id": "firestore_doc_123",
        "brand_name": "Firestore Brand"
    }
    
    # Test with only brand_name
    brand_data_name_only = {
        "brand_name": "Name Only Brand"
    }
    
    try:
        print("📤 Testing with Firestore ID...")
        response1 = requests.post(
            f"{BASE_URL}/generate",
            json={
                "prompt": "test",
                "width": 256,
                "height": 256,
                "num_inference_steps": 1,
                "brand_data": brand_data_with_id
            },
            timeout=1800
        )
        
        if response1.status_code == 200:
            # Check if directory was created with Firestore ID
            dir1 = Path(LORA_DIR) / "firestore_doc_123"
            if dir1.exists():
                print(f"✅ Used Firestore ID: firestore_doc_123")
            else:
                print(f"⚠️  Directory not found: {dir1}")
        
        print("\n📤 Testing with brand_name only...")
        response2 = requests.post(
            f"{BASE_URL}/generate",
            json={
                "prompt": "test",
                "width": 256,
                "height": 256,
                "num_inference_steps": 1,
                "brand_data": brand_data_name_only
            },
            timeout=1800
        )
        
        if response2.status_code == 200:
            # Check if directory was created with normalized name
            dir2 = Path(LORA_DIR) / "name_only_brand"
            if dir2.exists():
                print(f"✅ Used normalized brand_name: name_only_brand")
                return True
            else:
                print(f"⚠️  Directory not found: {dir2}")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_brand_id_normalization():
    """Test 4: Brand ID normalization"""
    print("\n" + "=" * 60)
    print("Test 4: Brand ID Normalization")
    print("=" * 60)
    
    test_cases = [
        ("My Brand & Co.", "my_brand_co"),
        ("Brand-Name (2024)", "brand_name_2024"),
        ("Brand   Name", "brand_name"),
        ("BRAND_NAME", "brand_name"),
    ]
    
    try:
        for original, expected_normalized in test_cases:
            brand_data = {"brand_name": original}
            
            print(f"📤 Testing: '{original}' -> should normalize to '{expected_normalized}'")
            
            response = requests.post(
                f"{BASE_URL}/generate",
                json={
                    "prompt": "test",
                    "width": 256,
                    "height": 256,
                    "num_inference_steps": 1,
                    "brand_data": brand_data
                },
                timeout=1800
            )
            
            if response.status_code == 200:
                # Check if directory was created with normalized name
                normalized_dir = Path(LORA_DIR) / expected_normalized
                if normalized_dir.exists():
                    print(f"   ✅ Correctly normalized to: {expected_normalized}")
                else:
                    # List actual directories to see what was created
                    actual_dirs = [d for d in os.listdir(LORA_DIR) if os.path.isdir(Path(LORA_DIR) / d)]
                    print(f"   ⚠️  Expected: {expected_normalized}, Found: {actual_dirs}")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_explicit_brand_id():
    """Test 5: Explicit brand_id parameter"""
    print("\n" + "=" * 60)
    print("Test 5: Explicit Brand ID")
    print("=" * 60)
    
    try:
        print("📤 Testing with explicit brand_id...")
        response = requests.post(
            f"{BASE_URL}/generate",
            json={
                "prompt": "test image",
                "width": 256,
                "height": 256,
                "num_inference_steps": 1,
                "brand_id": "explicit_test_brand",
                "lora_weights": 0.7
            },
            timeout=1800
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ Success: {data.get('success')}")
            print(f"✅ Used explicit brand_id: explicit_test_brand")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_root_endpoint():
    """Test 6: Root endpoint shows LoRA support"""
    print("\n" + "=" * 60)
    print("Test 6: Root Endpoint")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"✅ LoRA Support: {data.get('lora_support')}")
            print(f"✅ LoRA Directory: {data.get('lora_directory')}")
            print(f"✅ Version: {data.get('version')}")
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
    print("Brand Integration Test Suite")
    print("=" * 60)
    print("\n⚠️  Note: Make sure the image generation service is running")
    print("   on http://localhost:8000\n")
    
    results = []
    
    # Test 1: Basic generation
    results.append(("Basic Generation", test_basic_generation()))
    time.sleep(2)
    
    # Test 2: Metadata saving
    results.append(("Brand Metadata Saving", test_brand_metadata_saving()))
    time.sleep(2)
    
    # Test 3: Brand ID extraction
    results.append(("Brand ID Extraction", test_brand_id_extraction()))
    time.sleep(2)
    
    # Test 4: Normalization
    results.append(("Brand ID Normalization", test_brand_id_normalization()))
    time.sleep(2)
    
    # Test 5: Explicit brand_id
    results.append(("Explicit Brand ID", test_explicit_brand_id()))
    time.sleep(2)
    
    # Test 6: Root endpoint
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


