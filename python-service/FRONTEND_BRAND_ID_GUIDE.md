# How to Use Brand ID in Frontend for LoRA Image Generation

## Overview

The frontend automatically uses your selected brand for LoRA image generation. Here's how it works:

## Where Brand ID Comes From

### 1. Brand Selection
- **Location**: Dashboard or Post Generator page
- **Source**: `useBrand()` hook from `BrandContext`
- **Variable**: `selectedBrand` (contains brand data including `id` and `brand_name`)

### 2. Automatic Brand Detection
The system automatically:
1. Gets `selectedBrand` from the brand context
2. Extracts `brand_id` from `selectedBrand.id` or normalizes `selectedBrand.brand_name`
3. Passes `brandData` to the API
4. API extracts `brand_id` and loads the corresponding LoRA

## How It Works

### Frontend Flow:
```
1. User selects a brand (via BrandContext)
   ↓
2. selectedBrand is available in Post Generator
   ↓
3. When generating image, brandData is passed:
   {
     prompt: "...",
     brandData: selectedBrand  // Contains id, brand_name, colors, etc.
   }
   ↓
4. API extracts brand_id from brandData
   ↓
5. LoRA is loaded automatically (if exists)
```

### Code Location:
**File**: `mayvn/app/post-generator/page.tsx`
**Line**: ~739-741

```typescript
// Add brandData if available (for LoRA and metadata storage)
if (selectedBrand) {
  requestBody.brandData = selectedBrand
}
```

## Current Implementation

### ✅ What's Already Working:
1. **Automatic Brand Detection**: If `selectedBrand` exists, it's automatically passed
2. **Brand ID Extraction**: API extracts `brand_id` from `brandData.id` or `brandData.brand_name`
3. **LoRA Loading**: LoRA is loaded automatically if file exists at `loras/{brand_id}/style.safetensors`
4. **High Weight**: Now uses weight **1.0** (full strength) for maximum LoRA effect
5. **Enhanced Prompts**: Automatically adds `{brand_id}_style` keyword to prompts
6. **Better Quality**: Uses 35 steps, guidance_scale 8.5, and enhanced negative prompts

### 📋 What You Need to Do:

#### Step 1: Select a Brand
- Go to Dashboard
- Select a brand from the brand selector
- Or create a new brand via Brand DNA scraper

#### Step 2: Generate Image
- Go to Post Generator
- Create a post idea
- Generate AI prompt
- Click "Generate Image"
- **The LoRA will be used automatically!**

## Brand ID Matching

### How Brand ID is Determined:
1. **Priority 1**: `brandData.id` (Firestore document ID)
   - Example: `"3skqpsefifz4aomoly29"`

2. **Priority 2**: Normalized `brandData.brand_name`
   - Example: `"Apple"` → `"apple"`
   - Example: `"Brand Name 2024!"` → `"brand_name_2024"`

### LoRA File Location:
```
loras/
└── {normalized_brand_id}/
    └── style.safetensors
```

**Examples:**
- Brand ID: `"apple"` → `loras/apple/style.safetensors`
- Brand ID: `"3skqpsefifz4aomoly29"` → `loras/3skqpsefifz4aomoly29/style.safetensors`

## Verification

### Check if LoRA is Being Used:

1. **Check Service Logs**:
   ```
   INFO:lora_manager:[LORA] Found LoRA at: loras\apple\style.safetensors
   INFO:lora_manager:[LORA] Loading LoRA: loras\apple\style.safetensors with weight: 1.0
   INFO:lora_manager:[LORA] LoRA loaded successfully for brand: apple
   INFO:main:[IMAGE-GEN] Enhanced prompt with brand style keyword: apple_style
   ```

2. **Check Generated Image**:
   - Should show brand-specific style
   - Colors, composition, aesthetic should match brand

3. **Check Prompt**:
   - Should include `{brand_id}_style` keyword
   - Example: `"...product showcase, apple_style"`

## Troubleshooting

### LoRA Not Loading?

1. **Check Brand ID**:
   - Verify `selectedBrand.id` or normalized `brand_name`
   - Check if LoRA file exists: `loras/{brand_id}/style.safetensors`

2. **Check Logs**:
   - Look for: `"No LoRA found for brand_id: {brand_id}"`
   - Verify brand_id matches directory name exactly

3. **Verify Brand Selection**:
   - Make sure `selectedBrand` is not null
   - Check browser console for `selectedBrand` value

### Image Not Showing Brand Style?

1. **Check Weight**:
   - Should be 1.0 (full weight)
   - Check logs: `"LoRA weight: 1.0"`

2. **Check Prompt Enhancement**:
   - Should include `{brand_id}_style` keyword
   - Check logs: `"Enhanced prompt with brand style keyword"`

3. **Verify LoRA Training**:
   - Ensure LoRA was trained on SD 1.5
   - Check LoRA file size (should be ~10-50 MB)

## Example: Using Apple Brand

### 1. Select Apple Brand:
```typescript
// In Dashboard or Post Generator
selectedBrand = {
  id: "apple",  // or Firestore ID
  brand_name: "Apple",
  colors: ["#FFFFFF", "#1D1D1F", "#0071E3"],
  // ... other brand data
}
```

### 2. Generate Image:
- User creates post idea
- Generates AI prompt
- Clicks "Generate Image"

### 3. What Happens:
```
1. Frontend sends:
   {
     prompt: "professional product photography...",
     brandData: selectedBrand
   }

2. API extracts:
   brand_id = "apple"

3. Backend loads:
   loras/apple/style.safetensors (weight: 1.0)

4. Prompt enhanced:
   "professional product photography..., apple_style"

5. Image generated with Apple brand style!
```

## Summary

✅ **You don't need to manually enter brand_id!**

The system automatically:
- Detects selected brand
- Extracts brand_id
- Loads LoRA
- Enhances prompts
- Generates brand-styled images

**Just select a brand and generate images - it works automatically!**

