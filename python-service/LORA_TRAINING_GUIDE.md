# LoRA Training Guide

## Overview

This guide explains how to train LoRA (Low-Rank Adaptation) adapters for brand-specific image generation. LoRAs allow you to fine-tune Stable Diffusion models with a small, lightweight adapter that captures specific styles, products, or aesthetics.

## What is LoRA?

**LoRA (Low-Rank Adaptation)** is a training technique that:
- Trains a small adapter (typically 5-100MB) instead of the full model (4GB+)
- Can be combined with the base model at inference time
- Allows multiple LoRAs to be composed together
- Preserves the base model's general knowledge while adding specific style/product knowledge

## Why Train LoRAs?

For your marketing post generation system, LoRAs enable:

1. **Brand Style LoRAs**: Capture a brand's visual identity (colors, aesthetics, mood)
2. **Product LoRAs**: Learn specific product designs (iPhone 16, specific products)
3. **Photography Style LoRAs**: Learn professional product photography styles

**Phase 3** allows you to combine these LoRAs for highly accurate results!

## Prerequisites

### Software Requirements

1. **Python 3.8+**
2. **PyTorch** (with CUDA if using GPU)
3. **diffusers** library
4. **accelerate** library
5. **transformers** library
6. **Pillow** (PIL)
7. **Training script** (we'll use Kohya's LoRA training script or similar)

### Hardware Requirements

- **GPU Recommended**: NVIDIA GPU with 8GB+ VRAM (for faster training)
- **CPU Possible**: Much slower (hours to days vs minutes to hours)
- **Storage**: ~10-50GB for datasets and checkpoints

## Training Methods

### Method 1: Using Kohya's LoRA Training Script (Recommended)

Kohya's script is the most popular and well-maintained LoRA training tool.

#### Installation

```bash
# Clone the repository
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss

# Install dependencies
pip install -r requirements.txt

# Or use the GUI installer
python setup.py
```

#### Step 1: Prepare Your Dataset

**For Brand Style LoRA:**
- Collect 20-100 high-quality images of the brand's marketing materials
- Images should showcase the brand's visual identity
- Examples: Apple marketing images, product showcases, brand campaigns

**For Product LoRA:**
- Collect 20-50 images of the specific product
- Multiple angles, lighting conditions
- Examples: iPhone 16 product photos from different angles

**For Photography Style LoRA:**
- Collect 30-100 professional product photography images
- Similar lighting, composition style
- Examples: Studio product shots with similar aesthetics

**Dataset Structure:**
```
dataset/
├── brand_style/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── product_iphone16/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
└── photography_style/
    ├── image1.jpg
    ├── image2.jpg
    └── ...
```

#### Step 2: Prepare Captions

Each image needs a caption file (`.txt` with same name as image):

**For Brand Style:**
```
image1.jpg → image1.txt
Content: "Apple marketing style, minimal design, clean aesthetic, premium look, white background, soft lighting"
```

**For Product:**
```
iphone16_1.jpg → iphone16_1.txt
Content: "iPhone 16, triple camera layout, titanium frame, precision edges, premium materials"
```

**For Photography Style:**
```
studio_1.jpg → studio_1.txt
Content: "product photography, studio lighting, soft shadows, professional composition, centered product"
```

**Auto-captioning (Optional):**
```bash
# Use BLIP or CLIP for automatic captioning
# Or use tools like Waifu Diffusion Tagger for tags
```

#### Step 3: Configure Training

Create a training config file or use the GUI:

**Key Parameters:**
- **Base Model**: `runwayml/stable-diffusion-v1-5` (must match your service)
- **Learning Rate**: `0.0001` (start here, adjust if needed)
- **Batch Size**: `1-4` (depends on GPU memory)
- **Steps**: `1000-2000` (more steps = more training, but can overfit)
- **Rank (R)**: `4-16` (higher = more capacity, but larger file)
- **Alpha**: `8-32` (typically 2x rank, controls strength)
- **Save Steps**: `500` (save checkpoint every N steps)

**Example Config:**
```json
{
  "pretrained_model_name_or_path": "runwayml/stable-diffusion-v1-5",
  "train_data_dir": "./dataset/brand_style",
  "output_dir": "./output/apple_style_lora",
  "output_name": "apple_style",
  "save_model_as": "safetensors",
  "save_precision": "fp16",
  "seed": 42,
  "resolution": "512,512",
  "train_batch_size": 2,
  "gradient_accumulation_steps": 1,
  "learning_rate": "0.0001",
  "lr_scheduler": "cosine",
  "lr_warmup_steps": 100,
  "max_train_steps": 1500,
  "save_every_n_steps": 500,
  "mixed_precision": "fp16",
  "save_precision": "fp16",
  "optimizer_type": "AdamW8bit",
  "network_dim": 8,
  "network_alpha": 16,
  "clip_lr": 0.0001,
  "enable_bucket": true,
  "min_bucket_reso": 256,
  "max_bucket_reso": 1024
}
```

#### Step 4: Start Training

**Using GUI:**
```bash
python gui.py
# Configure settings in the GUI, then click "Start Training"
```

**Using Command Line:**
```bash
python train_network.py \
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \
  --train_data_dir="./dataset/brand_style" \
  --output_dir="./output/apple_style_lora" \
  --output_name="apple_style" \
  --save_model_as="safetensors" \
  --resolution="512,512" \
  --train_batch_size=2 \
  --learning_rate=0.0001 \
  --max_train_steps=1500 \
  --save_every_n_steps=500 \
  --network_dim=8 \
  --network_alpha=16 \
  --mixed_precision="fp16"
```

#### Step 5: Monitor Training

Watch for:
- **Loss decreasing**: Should trend downward
- **Overfitting**: Loss stops decreasing or starts increasing
- **Checkpoints**: Saved in `output_dir` every N steps

**Good Training:**
- Loss starts high (0.5-1.0) and decreases to 0.1-0.3
- Images improve over time
- No sudden spikes in loss

**Overfitting Signs:**
- Loss decreases then increases
- Model memorizes training images
- Poor generalization to new prompts

#### Step 6: Test Your LoRA

After training, test with different prompts:

```python
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")

# Load your trained LoRA
pipe.load_lora_weights("./output/apple_style_lora", weight_name="apple_style.safetensors")

# Generate test image
image = pipe(
    "a beautiful product showcase, Apple style, minimal design",
    num_inference_steps=50
).images[0]

image.save("test_output.png")
```

#### Step 7: Deploy to Your Service

1. **Copy LoRA file** to your service:
   ```bash
   cp output/apple_style_lora/apple_style.safetensors \
      mayvn/python-service/loras/apple_brand_style/style.safetensors
   ```

2. **Create metadata** (optional):
   ```bash
   # The service will auto-create brand_metadata.json
   # Or create lora_metadata.json manually:
   ```

   ```json
   {
     "version": "1.0.0",
     "training_info": {
       "base_model": "runwayml/stable-diffusion-v1-5",
       "steps": 1500,
       "learning_rate": 0.0001,
       "rank": 8,
       "alpha": 16,
       "dataset_size": 50,
       "trained_at": "2024-01-15T10:30:00"
     },
     "description": "Apple brand style LoRA - minimal, clean, premium aesthetic",
     "type": "style",
     "recommended_weight": 0.7
   }
   ```

3. **Test via API**:
   ```bash
   curl -X POST http://localhost:8000/generate \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "a premium product showcase",
       "lora_configs": [
         {"brand_id": "apple_brand_style", "weight": 0.7, "type": "style"}
       ]
     }'
   ```

## Method 2: Using diffusers Training Script

For more control, use diffusers' training script directly:

```bash
# Install training dependencies
pip install diffusers[training] accelerate datasets

# Run training
accelerate launch train_lora.py \
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \
  --instance_data_dir="./dataset/brand_style" \
  --output_dir="./output/apple_style_lora" \
  --instance_prompt="Apple marketing style, minimal design" \
  --resolution=512 \
  --train_batch_size=1 \
  --gradient_accumulation_steps=1 \
  --learning_rate=1e-4 \
  --max_train_steps=1500 \
  --lr_scheduler="constant" \
  --lr_warmup_steps=0 \
  --rank=8
```

## Training Tips

### 1. Dataset Quality > Quantity
- 20-50 high-quality, diverse images > 100+ low-quality images
- Ensure images are relevant and consistent

### 2. Caption Quality Matters
- Detailed, descriptive captions improve results
- Include key visual elements in captions
- Be consistent with terminology

### 3. Learning Rate
- Start with `0.0001` (1e-4)
- Too high: unstable training, poor results
- Too low: slow training, may not learn enough

### 4. Rank (R) Selection
- **R=4**: Small file (~5MB), limited capacity
- **R=8**: Good balance (~10MB), recommended starting point
- **R=16**: Higher capacity (~20MB), for complex styles
- **R=32+**: Very high capacity, may overfit

### 5. Training Steps
- **500-1000 steps**: Quick test, may underfit
- **1000-2000 steps**: Good for most use cases
- **2000+ steps**: Risk of overfitting, monitor carefully

### 6. Weight Selection
- **0.5-0.7**: Subtle influence, good for style LoRAs
- **0.7-0.9**: Strong influence, good for product LoRAs
- **1.0**: Maximum influence, may be too strong

## Phase 3: Combining Multiple LoRAs

Once you have multiple trained LoRAs, combine them:

```json
{
  "prompt": "Create a dramatic, ultra-premium product showcase of the iPhone 16...",
  "lora_configs": [
    {
      "brand_id": "apple_brand_style",
      "weight": 0.7,
      "type": "style"
    },
    {
      "brand_id": "iphone_16_product",
      "weight": 0.8,
      "type": "product"
    },
    {
      "brand_id": "product_photography",
      "weight": 0.6,
      "type": "photography"
    }
  ]
}
```

**Result**: Highly accurate iPhone 16 images with Apple's brand style and professional photography!

## Troubleshooting

### LoRA Not Working
- Check LoRA file format (must be `.safetensors`)
- Verify base model matches (`runwayml/stable-diffusion-v1-5`)
- Check file path and naming

### Poor Quality Results
- Increase training steps
- Improve dataset quality
- Adjust learning rate
- Try different rank values

### Overfitting
- Reduce training steps
- Increase dataset diversity
- Lower learning rate
- Use data augmentation

### Out of Memory
- Reduce batch size
- Use gradient accumulation
- Lower resolution
- Use CPU offloading

## Resources

- **Kohya's LoRA Training**: https://github.com/bmaltais/kohya_ss
- **Diffusers Training Docs**: https://huggingface.co/docs/diffusers/training/lora
- **LoRA Paper**: https://arxiv.org/abs/2106.09685
- **Stable Diffusion Models**: https://huggingface.co/models?library=diffusers

## Next Steps

1. **Train your first LoRA**: Start with brand style (easiest)
2. **Test and iterate**: Adjust weights, retrain if needed
3. **Train product LoRAs**: For specific products
4. **Combine with Phase 3**: Use multiple LoRAs together
5. **Fine-tune weights**: Find optimal weight combinations

Good luck with your LoRA training! 🚀


