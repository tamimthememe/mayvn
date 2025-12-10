"""
Standalone LoRA Test Script
Test your LoRA separately to verify it works correctly

Usage:
    python test_lora_standalone.py --brand-id apple
    python test_lora_standalone.py --brand-id cheezious

Note: For best results (matching your script), install PEFT:
    pip install peft
"""

import argparse
import os
import sys
from pathlib import Path
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def normalize_brand_id(brand_id: str) -> str:
    """Normalize brand_id to filesystem-safe string"""
    import re
    normalized = brand_id.lower()
    normalized = re.sub(r'[^\w\-_]', '_', normalized)
    normalized = re.sub(r'_+', '_', normalized)
    return normalized.strip('_')

def find_lora_file(brand_id: str):
    """Find LoRA file for brand_id"""
    normalized_id = normalize_brand_id(brand_id)
    lora_base_dir = os.getenv("LORA_BASE_DIR", "loras")
    
    # Try different possible LoRA file names
    possible_names = ["style.safetensors", "lora.safetensors", f"{normalized_id}.safetensors"]
    
    brand_dir = os.path.join(lora_base_dir, normalized_id)
    
    for name in possible_names:
        lora_path = os.path.join(brand_dir, name)
        if os.path.exists(lora_path):
            return os.path.dirname(lora_path), os.path.basename(lora_path)
    
    # Also try with _style suffix
    brand_dir_style = os.path.join(lora_base_dir, f"{normalized_id}_style_lora")
    for name in possible_names:
        lora_path = os.path.join(brand_dir_style, name)
        if os.path.exists(lora_path):
            return os.path.dirname(lora_path), os.path.basename(lora_path)
    
    return None, None

def main():
    parser = argparse.ArgumentParser(description="Test LoRA standalone")
    parser.add_argument("--brand-id", type=str, required=True, help="Brand ID (e.g., apple, cheezious)")
    parser.add_argument("--prompt", type=str, help="Custom prompt (optional)")
    parser.add_argument("--output-dir", type=str, default="test_output", help="Output directory for images")
    parser.add_argument("--device", type=str, choices=["cuda", "cpu"], default=None, help="Device to use (auto-detect if not specified)")
    parser.add_argument("--steps", type=int, default=35, help="Number of inference steps")
    parser.add_argument("--guidance", type=float, default=8.5, help="Guidance scale")
    parser.add_argument("--weight", type=float, default=1.0, help="LoRA weight")
    
    args = parser.parse_args()
    
    # Detect device
    if args.device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device = args.device
    
    torch_dtype = torch.float32 if device == "cpu" else torch.float16
    
    print("=" * 60)
    print("LoRA Standalone Test Script")
    print("=" * 60)
    print(f"Brand ID: {args.brand_id}")
    print(f"Device: {device}")
    print(f"Torch dtype: {torch_dtype}")
    print(f"Steps: {args.steps}")
    print(f"Guidance: {args.guidance}")
    print(f"LoRA Weight: {args.weight}")
    print("=" * 60)
    
    # Find LoRA file
    lora_dir, weight_name = find_lora_file(args.brand_id)
    
    if not lora_dir or not weight_name:
        print(f"\n❌ ERROR: LoRA file not found for brand_id: {args.brand_id}")
        print(f"\nSearched in:")
        normalized_id = normalize_brand_id(args.brand_id)
        lora_base_dir = os.getenv("LORA_BASE_DIR", "loras")
        print(f"  - {os.path.join(lora_base_dir, normalized_id)}/")
        print(f"  - {os.path.join(lora_base_dir, f'{normalized_id}_style_lora')}/")
        print(f"\nMake sure your LoRA file is named: style.safetensors, lora.safetensors, or {normalized_id}.safetensors")
        return 1
    
    print(f"\n✅ Found LoRA:")
    print(f"   Directory: {lora_dir}")
    print(f"   File: {weight_name}")
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    print(f"\n📁 Output directory: {output_dir}")
    
    # Load model
    print("\n" + "=" * 60)
    print("Loading Stable Diffusion model...")
    print("=" * 60)
    
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch_dtype,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        # Use DPMSolverMultistepScheduler (better quality)
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        print("✅ Using DPMSolverMultistepScheduler")
        
        pipe = pipe.to(device)
        print(f"✅ Model loaded on {device}")
        
    except Exception as e:
        print(f"\n❌ ERROR loading model: {e}")
        return 1
    
    # Load LoRA
    print("\n" + "=" * 60)
    print("Loading LoRA...")
    print("=" * 60)
    
    try:
        # Use PEFT method (with adapter_name and set_adapters) - matches your script
        adapter_name = f"{normalize_brand_id(args.brand_id)}_adapter"
        print(f"Loading LoRA with PEFT backend (adapter_name: {adapter_name})...")
        
        pipe.load_lora_weights(
            lora_dir,
            weight_name=weight_name,
            adapter_name=adapter_name
        )
        print("✅ LoRA weights loaded")
        
        pipe.set_adapters([adapter_name], adapter_weights=[args.weight])
        print(f"✅ Adapter set with weight: {args.weight}")
    except Exception as e:
        print(f"\n❌ ERROR loading LoRA: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Generate images
    print("\n" + "=" * 60)
    print("Generating images...")
    print("=" * 60)
    
    # Default prompts based on brand
    normalized_id = normalize_brand_id(args.brand_id)
    
    if args.prompt:
        # Use custom prompt
        prompts = [(normalized_id, args.prompt)]
    elif normalized_id == "cheezious" or "cheezious" in normalized_id:
        # Cheezious food prompts
        prompts = [
            ("burger", f"professional food photography of a delicious burger, {normalized_id}_style, melted cheese, fresh ingredients, appetizing, studio lighting, food advertisement"),
            ("pizza", f"professional food photography of a cheesy pizza, {normalized_id}_style, melted mozzarella, delicious toppings, restaurant quality, food ad"),
            ("fries", f"professional food photography of golden crispy fries, {normalized_id}_style, with cheese sauce, appetizing, fast food advertisement"),
            ("sandwich", f"professional food photography of a loaded cheese sandwich, {normalized_id}_style, melted cheese, delicious, restaurant menu photo"),
        ]
    elif normalized_id == "apple" or "apple" in normalized_id:
        # Apple style prompts
        prompts = [
            ("product1", f"professional product photography of wireless earbuds, {normalized_id}_style, pristine white background, soft studio lighting, minimalist composition, high-end luxury product, extremely detailed, sharp focus, premium quality, clean aesthetic"),
            ("product2", f"professional product showcase, {normalized_id}_style, minimal design, clean aesthetic, premium look, white background"),
        ]
    else:
        # Generic prompts
        prompts = [
            ("test1", f"professional product photography, {normalized_id}_style, high quality, detailed, sharp focus"),
            ("test2", f"marketing image, {normalized_id}_style, brand aesthetic, professional"),
        ]
    
    negative_prompt = "blurry, low quality, distorted, text, letters, words, typography, watermark, ugly, amateur, cluttered, busy background, low resolution"
    
    for name, prompt in prompts:
        print(f"\n📸 Generating {name}...")
        print(f"   Prompt: {prompt[:80]}...")
        
        try:
            with torch.no_grad():
                image = pipe(
                    prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=args.steps,
                    guidance_scale=args.guidance,
                    width=512,
                    height=512
                ).images[0]
            
            output_path = output_dir / f"{normalized_id}_{name}.png"
            image.save(output_path)
            size_kb = os.path.getsize(output_path) // 1024
            print(f"   ✅ Saved: {output_path} ({size_kb} KB)")
            
        except Exception as e:
            print(f"   ❌ ERROR generating {name}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("=" * 60)
    print(f"Check images in: {output_dir.absolute()}")
    print("=" * 60)
    
    return 0

if __name__ == "__main__":
    exit(main())

