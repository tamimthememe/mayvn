# Using Brand Scraper Data for LoRA Training

## Overview

Yes! You can use your brand scraper output for LoRA training. The scraper already collects:
- **Images**: Gallery images and logos from the website
- **Brand metadata**: Colors, fonts, tone of voice, etc.

However, the scraper currently:
- Only collects **5 gallery images** (limited for training)
- Doesn't generate **captions** for images (needed for training)

## Quick Start

### Step 1: Run Your Brand Scraper

```bash
python brand_scraper.py
# Enter website URL (e.g., https://apple.com)
# This creates brand_dna.json
```

### Step 2: Prepare Training Dataset

```bash
python prepare_lora_dataset.py \
  --brand-dna brand_dna.json \
  --output-dir dataset/apple_style \
  --max-images 50 \
  --include-logos
```

This will:
- Download all images from `brand_dna.json`
- Generate captions for each image based on brand data
- Create a training-ready dataset structure

### Step 3: Review Generated Captions

Check the captions in your dataset:
```bash
# View a caption file
cat dataset/apple_style/0001_gallery.txt
# Output: "Apple marketing style, professional photography, minimal aesthetic, color palette #FFFFFF, #1D1D1F, #0071E3, accent color #0071E3, minimal design, clean composition, premium look"
```

### Step 4: Enhance Captions (Optional)

If needed, manually edit captions to be more descriptive:
```bash
# Edit caption
nano dataset/apple_style/0001_gallery.txt
```

### Step 5: Train LoRA

Follow the training guide with your prepared dataset:
```bash
# Use Kohya's script or diffusers
python train_network.py \
  --train_data_dir="./dataset/apple_style" \
  --output_dir="./output/apple_style_lora" \
  ...
```

## Improving Image Collection

### Option 1: Enhance the Scraper

Modify your scraper to collect more images:

```python
# In your scraper, increase gallery size:
gallery = gallery[:20]  # Instead of [:5]

# Or collect ALL images, not just top 5:
gallery = [img for img in all_images if img.get("url") and img.get("url") not in logo_urls_set]
# Sort by size and take top 20-50
gallery.sort(key=lambda x: (x.get("width", 0) * x.get("height", 0)), reverse=True)
gallery = gallery[:50]  # Top 50 largest images
```

### Option 2: Scrape Multiple Pages

Your scraper already crawls multiple pages! Just increase limits:

```python
MAX_PAGES_TO_CRAWL = 10  # Instead of 5
MAX_DEPTH = 3  # Instead of 2
```

This will collect images from more pages.

### Option 3: Manual Image Addition

If scraper doesn't find enough images:

1. **Manually collect brand images**:
   - Download from brand's website
   - Use brand's social media images
   - Use product photography from brand

2. **Add to dataset**:
   ```bash
   # Copy images to dataset directory
   cp ~/Downloads/apple_marketing_*.jpg dataset/apple_style/
   
   # Generate captions for new images
   python prepare_lora_dataset.py --add-images dataset/apple_style/ --brand-dna brand_dna.json
   ```

## Caption Generation

The `prepare_lora_dataset.py` script automatically generates captions using:

1. **Brand name** from scraper
2. **Colors** (top 3 colors from brand palette)
3. **Accent color** (primary brand color)
4. **Tone of voice** (brand communication style)
5. **Fonts** (brand typography)
6. **Visual style keywords** (minimal, clean, premium, etc.)

**Example Generated Caption:**
```
Apple marketing style, professional photography, minimal aesthetic, 
color palette #FFFFFF, #1D1D1F, #0071E3, accent color #0071E3, 
minimal design, clean composition, premium look, typography SF Pro
```

## Dataset Structure

After running the preparation script:

```
dataset/
└── apple_style/
    ├── 0001_gallery.jpg
    ├── 0001_gallery.txt
    ├── 0002_gallery.jpg
    ├── 0002_gallery.txt
    ├── ...
    └── dataset_info.json
```

Each image has a corresponding `.txt` file with its caption.

## Best Practices

### 1. Image Quality
- **Minimum**: 20 images (works, but limited)
- **Recommended**: 50-100 images (best results)
- **Quality > Quantity**: 50 high-quality images > 200 low-quality

### 2. Image Types
- **Brand Style LoRA**: Use marketing images, product showcases, brand campaigns
- **Product LoRA**: Use product photos (specific products)
- **Photography Style LoRA**: Use professional product photography

### 3. Caption Quality
- **Be descriptive**: Include visual elements, colors, style
- **Be consistent**: Use same terminology across captions
- **Include brand elements**: Colors, fonts, tone, aesthetic

### 4. Dataset Diversity
- **Multiple angles**: Different product angles
- **Different lighting**: Various lighting conditions
- **Different compositions**: Various layouts and styles

## Workflow Example

### Complete Workflow for Apple Brand Style LoRA

```bash
# 1. Scrape Apple website
python brand_scraper.py
# Enter: https://apple.com
# Output: brand_dna.json

# 2. Prepare dataset
python prepare_lora_dataset.py \
  --brand-dna brand_dna.json \
  --output-dir dataset/apple_brand_style \
  --max-images 50

# 3. Review dataset
ls dataset/apple_brand_style/
# Check images and captions

# 4. Train LoRA
python train_network.py \
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \
  --train_data_dir="./dataset/apple_brand_style" \
  --output_dir="./output/apple_brand_style_lora" \
  --output_name="apple_brand_style" \
  --max_train_steps=1500 \
  --network_dim=8 \
  --network_alpha=16

# 5. Deploy to service
cp output/apple_brand_style_lora/apple_brand_style.safetensors \
   mayvn/python-service/loras/apple_brand_style/style.safetensors

# 6. Test via API
curl -X POST http://localhost:8000/generate-async \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a premium product showcase",
    "lora_configs": [
      {"brand_id": "apple_brand_style", "weight": 0.7, "type": "style"}
    ]
  }'
```

## Limitations & Solutions

### Limitation 1: Only 5 Gallery Images

**Solution**: Modify scraper to collect more:
```python
# In scrape_brand_dna function, change:
gallery = gallery[:20]  # Or higher
```

### Limitation 2: No Product-Specific Images

**Solution**: 
- Scrape product pages specifically
- Manually add product images
- Use brand's product photography

### Limitation 3: Generic Captions

**Solution**:
- Manually edit captions for better descriptions
- Use image analysis tools (BLIP, CLIP) for auto-captioning
- Add more specific visual details to captions

## Advanced: Using Ollama for Better Captions

You can enhance caption generation using Ollama:

```python
def generate_detailed_caption(image_path: Path, brand_data: Dict) -> str:
    """Generate detailed caption using Ollama vision model."""
    # Use Ollama's vision capabilities to analyze image
    # Then combine with brand data for rich captions
    ...
```

## Summary

✅ **Yes, you can use scraper data for LoRA training!**

**What you get:**
- Images from brand website
- Brand metadata (colors, fonts, tone)
- Automatic caption generation

**What to improve:**
- Collect more images (20-100 recommended)
- Enhance captions with more detail
- Add product-specific images if needed

**Next Steps:**
1. Run `prepare_lora_dataset.py` on your `brand_dna.json`
2. Review and enhance captions
3. Train your first LoRA
4. Test with Phase 3 multiple LoRA composition!


