# Testing Guide - LoRA Implementation Phase 1

This guide covers how to test the current LoRA implementation with brand metadata storage.

## Prerequisites

1. **Python Service Running**: Make sure the image generation service is running
   ```bash
   cd python-service
   python main.py
   ```
   Or use your start script:
   ```bash
   python start.bat  # Windows
   # or
   ./start.sh       # Linux/Mac
   ```

2. **Service URL**: Default is `http://localhost:8000`

## Test Scenarios

### Test 1: Basic Functionality (No Brand Data)

Test that existing functionality still works without brand data.

**Using test script:**
```bash
python test_lora.py
```

**Manual API test:**
```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "width": 512,
    "height": 512,
    "num_inference_steps": 15
  }'
```

**Expected Result:**
- ✅ Image generated successfully
- ✅ Uses base model (no LoRA)
- ✅ No errors

---

### Test 2: With Brand Data (No LoRA File)

Test that brand metadata is saved even when LoRA file doesn't exist.

**Using Python script:**
```python
import requests
import json

response = requests.post(
    "http://localhost:8000/generate",
    json={
        "prompt": "a professional marketing photo of a croissant",
        "width": 512,
        "height": 512,
        "num_inference_steps": 15,
        "brand_data": {
            "id": "test_brand_123",
            "brand_name": "Test Bakery",
            "tagline": "Fresh baked daily",
            "colors": ["#FF5733", "#33FF57"],
            "brand_values": ["quality", "freshness"],
            "tone_of_voice": ["friendly", "professional"]
        }
    },
    timeout=1800
)

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

**Check metadata was saved:**
```bash
# Check if metadata file was created
ls loras/test_brand_123/brand_metadata.json

# View the metadata
cat loras/test_brand_123/brand_metadata.json
```

**Expected Result:**
- ✅ Image generated successfully
- ✅ Uses base model (no LoRA file found)
- ✅ Metadata saved to `loras/test_brand_123/brand_metadata.json`
- ✅ Brand directory created

---

### Test 3: With Brand ID (Extracted from Brand Data)

Test automatic brand_id extraction from brand_data.

**Test:**
```python
import requests

# Test with brand_data (should extract brand_id automatically)
response = requests.post(
    "http://localhost:8000/generate",
    json={
        "prompt": "a beautiful landscape",
        "width": 512,
        "height": 512,
        "num_inference_steps": 15,
        "brand_data": {
            "id": "my_brand_456",
            "brand_name": "My Brand"
        }
    },
    timeout=1800
)

print(f"Status: {response.status_code}")
```

**Expected Result:**
- ✅ Brand ID extracted: `my_brand_456`
- ✅ Metadata saved to `loras/my_brand_456/brand_metadata.json`
- ✅ Service logs show: `"Brand ID extracted from brand_data: my_brand_456"`

---

### Test 4: With Explicit Brand ID

Test when brand_id is provided directly.

**Test:**
```python
import requests

response = requests.post(
    "http://localhost:8000/generate",
    json={
        "prompt": "a beautiful landscape",
        "width": 512,
        "height": 512,
        "num_inference_steps": 15,
        "brand_id": "explicit_brand_789",
        "lora_weights": 0.8
    },
    timeout=1800
)

print(f"Status: {response.status_code}")
```

**Expected Result:**
- ✅ Uses provided brand_id: `explicit_brand_789`
- ✅ Tries to load LoRA from `loras/explicit_brand_789/`
- ✅ Falls back to base model if LoRA not found

---

### Test 5: Frontend Integration

Test the full flow from frontend to Python service.

**Steps:**
1. Start the Next.js frontend:
   ```bash
   npm run dev
   ```

2. Navigate to Post Generator page

3. Select a brand (or create one)

4. Generate a prompt using the AI prompt generator

5. Click "Generate Image"

6. Check the browser console for logs

7. Check Python service logs for:
   - Brand ID extraction
   - Metadata saving
   - LoRA loading attempt

**Expected Result:**
- ✅ Image generated and displayed
- ✅ Brand metadata saved automatically
- ✅ No errors in console

---

### Test 6: Brand ID Normalization

Test that brand IDs with special characters are normalized correctly.

**Test:**
```python
import requests

# Test with brand name that needs normalization
response = requests.post(
    "http://localhost:8000/generate",
    json={
        "prompt": "test image",
        "width": 512,
        "height": 512,
        "num_inference_steps": 1,
        "brand_data": {
            "brand_name": "My Brand & Co. (2024)"
        }
    },
    timeout=1800
)

# Check what directory was created
import os
print("Created directories:", [d for d in os.listdir("loras") if os.path.isdir(f"loras/{d}")])
```

**Expected Result:**
- ✅ Brand ID normalized: `my_brand_co_2024`
- ✅ Directory created: `loras/my_brand_co_2024/`
- ✅ Metadata saved correctly

---

### Test 7: Metadata Loading

Test loading previously saved metadata.

**Test:**
```python
from lora_manager import load_brand_metadata, normalize_brand_id

# Load metadata for a brand
brand_id = "test_brand_123"
metadata = load_brand_metadata(brand_id)

if metadata:
    print("Metadata loaded:")
    print(f"  Brand Name: {metadata.get('brand_name')}")
    print(f"  Colors: {metadata.get('colors')}")
    print(f"  Saved At: {metadata.get('saved_at')}")
else:
    print("No metadata found")
```

**Expected Result:**
- ✅ Metadata loaded successfully
- ✅ All fields present
- ✅ Timestamp included

---

## Quick Test Script

Run the comprehensive test suite:

```bash
python test_lora.py
```

This tests:
- ✅ Backward compatibility (no brand_id)
- ✅ LoRA fallback (when file doesn't exist)
- ✅ API structure validation
- ✅ Root endpoint LoRA info

---

## Manual Testing Checklist

- [ ] Service starts without errors
- [ ] Health check endpoint works: `GET http://localhost:8000/health`
- [ ] Root endpoint shows LoRA support: `GET http://localhost:8000/`
- [ ] Image generation works without brand data
- [ ] Image generation works with brand_data
- [ ] Brand metadata is saved to correct directory
- [ ] Brand ID is normalized correctly
- [ ] Frontend can generate images with brand
- [ ] No errors in Python service logs
- [ ] No errors in frontend console

---

## Troubleshooting

### Issue: Metadata not saving
- Check Python service logs for errors
- Verify `loras/` directory is writable
- Check brand_data structure matches expected format

### Issue: Brand ID not extracted
- Check logs for: `"Brand ID extracted from brand_data"`
- Verify brand_data has `id` or `brand_name` field
- Check normalization function output

### Issue: LoRA not loading
- Verify LoRA file exists: `loras/{brand_id}/style.safetensors`
- Check file permissions
- Verify LoRA was trained on SD 1.5
- Check service logs for LoRA loading errors

### Issue: Frontend not calling Python service
- Check `PYTHON_SERVICE_URL` environment variable
- Verify Python service is running
- Check browser console for fetch errors
- Verify `/api/generate-image` route is working

---

## Next Steps

Once all tests pass, you're ready for Phase 2:
- LoRA caching system
- Performance optimizations
- Multiple LoRA support


