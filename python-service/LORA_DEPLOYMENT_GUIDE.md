# LoRA Deployment Guide

## What to Do After Training Your LoRA

Once you've trained your LoRA file, follow these steps to deploy it to your image generation service.

## Step 1: Locate Your Trained LoRA File

After training, you'll have a LoRA file (usually `.safetensors` format) in your output directory:

```
output/
└── apple_brand_style_lora/
    ├── apple_brand_style.safetensors  ← This is your LoRA file
    └── ...
```

**Common file names:**
- `{output_name}.safetensors` (e.g., `apple_brand_style.safetensors`)
- `pytorch_lora_weights.safetensors` (if using Kohya's default)
- `lora.safetensors` (if you renamed it)

## Step 2: Determine Your Brand ID

Your `brand_id` is the identifier used to load the LoRA. It should match:
- The brand name from your scraper (normalized)
- The directory name where you'll place the LoRA

**Examples:**
- Brand name: "Apple" → `brand_id`: `apple`
- Brand name: "Nike" → `brand_id`: `nike`
- Firestore ID: `3skqpsefifz4aomoly29` → `brand_id`: `3skqpsefifz4aomoly29`

**Normalization rules:**
- Lowercase
- Spaces → underscores
- Special characters removed
- Example: "Brand Name 2024!" → `brand_name_2024`

## Step 3: Create Directory Structure

Create a directory for your brand in the `loras/` folder:

```bash
# Navigate to python-service directory
cd mayvn/python-service

# Create brand directory (replace 'apple' with your brand_id)
mkdir -p loras/apple
```

**Windows PowerShell:**
```powershell
cd mayvn\python-service
New-Item -ItemType Directory -Path "loras\apple" -Force
```

## Step 4: Copy LoRA File

Copy your trained LoRA file to the brand directory and rename it:

```bash
# Copy and rename to standard name
cp output/apple_brand_style_lora/apple_brand_style.safetensors loras/apple/style.safetensors
```

**Windows PowerShell:**
```powershell
Copy-Item "output\apple_brand_style_lora\apple_brand_style.safetensors" "loras\apple\style.safetensors"
```

**Supported file names** (in order of preference):
1. `style.safetensors` ✅ (recommended)
2. `lora.safetensors`
3. `{brand_id}.safetensors` (e.g., `apple.safetensors`)

## Step 5: Add Brand Metadata (Optional but Recommended)

If you have brand metadata from your scraper, add it to the directory:

```bash
# Copy brand_metadata.json if you have it
cp brand_dna.json loras/apple/brand_metadata.json
```

Or create it manually:

```json
{
  "brand_id": "apple",
  "brand_name": "Apple",
  "tagline": "Think Different",
  "tone_of_voice": ["minimal", "premium", "innovative"],
  "colors": ["#FFFFFF", "#1D1D1F", "#0071E3"],
  "accent_color": "#0071E3",
  "fonts": ["SF Pro", "Helvetica Neue"],
  "main_font": "SF Pro",
  "brand_values": ["innovation", "simplicity", "quality"],
  "target_audience": ["tech enthusiasts", "creative professionals"],
  "business_overview": "..."
}
```

**Note:** The system will auto-generate this if you pass `brand_data` in API requests, but having it pre-saved is useful.

## Step 6: Verify Directory Structure

Your final structure should look like:

```
mayvn/python-service/
└── loras/
    ├── README.md (auto-generated)
    └── apple/  ← Your brand_id
        ├── style.safetensors  ← Your LoRA file
        └── brand_metadata.json  ← Optional metadata
```

## Step 7: Restart the Python Service

Restart your Python service to ensure it recognizes the new LoRA:

```bash
# Stop the service (Ctrl+C)
# Then restart:
cd mayvn/python-service
python main.py
```

**Or if using uvicorn:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Step 8: Test Your LoRA

### Option 1: Test via API (Recommended)

```bash
curl -X POST http://localhost:8000/generate-async \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a premium product showcase, minimal design, clean aesthetic",
    "width": 512,
    "height": 512,
    "brand_id": "apple",
    "lora_weights": 0.8
  }'
```

### Option 2: Test via Frontend

1. Go to your post generator page
2. Select the brand (or enter brand_id)
3. Generate an image
4. The system will automatically use your LoRA if `brand_id` matches

### Option 3: Use Test Script

```bash
python test_lora.py
```

## Step 9: Verify LoRA is Loaded

Check the service logs when generating:

```
INFO:main:[IMAGE-GEN] Brand ID: apple (LoRA weight: 0.8)
INFO:lora_manager:[LORA] Found LoRA at: loras/apple/style.safetensors
INFO:lora_manager:[LORA] Loading LoRA: loras/apple/style.safetensors with weight: 0.8
INFO:lora_manager:[LORA] LoRA loaded successfully for brand: apple with weight: 0.8
```

If you see warnings like:
```
WARNING:lora_manager:[LORA] No LoRA found for brand_id: apple
```

**Troubleshooting:**
1. Check directory name matches `brand_id` exactly (case-sensitive)
2. Check file name is `style.safetensors`, `lora.safetensors`, or `{brand_id}.safetensors`
3. Verify file is `.safetensors` format (not `.ckpt` or `.pt`)
4. Restart the service

## Step 10: Adjust LoRA Weight (Optional)

If the LoRA effect is too strong or too weak, adjust the weight:

```json
{
  "prompt": "...",
  "brand_id": "apple",
  "lora_weights": 0.5  // Lower = less effect, Higher = more effect (0.0-1.0)
}
```

**Weight guidelines:**
- `0.3-0.5`: Subtle brand influence
- `0.6-0.8`: Moderate brand style (recommended)
- `0.9-1.0`: Strong brand style (may overfit)

## Complete Example: Deploying Apple Brand LoRA

```bash
# 1. After training, you have:
output/apple_brand_style_lora/apple_brand_style.safetensors

# 2. Create directory
mkdir -p mayvn/python-service/loras/apple

# 3. Copy LoRA file
cp output/apple_brand_style_lora/apple_brand_style.safetensors \
   mayvn/python-service/loras/apple/style.safetensors

# 4. Add metadata (if available)
cp brand_dna.json mayvn/python-service/loras/apple/brand_metadata.json

# 5. Verify structure
ls -la mayvn/python-service/loras/apple/
# Should show:
# - style.safetensors
# - brand_metadata.json

# 6. Restart service
cd mayvn/python-service
python main.py

# 7. Test
curl -X POST http://localhost:8000/generate-async \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a premium product showcase",
    "brand_id": "apple",
    "lora_weights": 0.8
  }'
```

## Using Phase 3: Multiple LoRAs

If you have multiple LoRAs (e.g., style + product), you can compose them:

```json
{
  "prompt": "a premium product showcase",
  "lora_configs": [
    {
      "brand_id": "apple",
      "weight": 0.7,
      "type": "style"
    },
    {
      "brand_id": "iphone_16",
      "weight": 0.5,
      "type": "product"
    }
  ]
}
```

## Preloading LoRAs (Optional)

To preload your LoRA at service startup for faster first requests:

Add to `.env`:
```bash
LORA_PRELOAD_BRANDS=apple,nike,brand_abc123
```

## Troubleshooting

### LoRA Not Found
- ✅ Check `brand_id` matches directory name exactly
- ✅ Check file is named `style.safetensors` or `lora.safetensors`
- ✅ Verify file exists: `ls loras/{brand_id}/style.safetensors`
- ✅ Restart the service

### LoRA Loads But No Effect
- ✅ Increase `lora_weights` (try 0.9-1.0)
- ✅ Check LoRA was trained on SD 1.5 base model
- ✅ Verify training dataset quality
- ✅ Check prompt includes relevant keywords

### Out of Memory Errors
- ✅ Reduce image dimensions
- ✅ Use CPU offloading (already enabled)
- ✅ Reduce LoRA cache size in `.env`: `LORA_CACHE_MAX_SIZE=3`

### Service Won't Start
- ✅ Check LoRA file format (must be `.safetensors`)
- ✅ Verify file isn't corrupted
- ✅ Check file permissions
- ✅ Review service logs for errors

## Quick Reference

**Directory Structure:**
```
loras/
└── {brand_id}/
    ├── style.safetensors  ← Required
    └── brand_metadata.json  ← Optional
```

**API Request:**
```json
{
  "prompt": "...",
  "brand_id": "{brand_id}",
  "lora_weights": 0.8
}
```

**File Naming Priority:**
1. `style.safetensors` ✅
2. `lora.safetensors`
3. `{brand_id}.safetensors`

**Brand ID Normalization:**
- Lowercase
- Spaces → underscores
- Special chars removed

## Next Steps

1. ✅ Deploy your LoRA
2. ✅ Test with API
3. ✅ Adjust weights as needed
4. ✅ Train more LoRAs for different brands
5. ✅ Use Phase 3 to compose multiple LoRAs!

