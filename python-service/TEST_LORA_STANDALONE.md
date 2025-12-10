# Standalone LoRA Test Script

Test your LoRA files independently to verify they work correctly before using them in the service.

## Quick Start

### Test Apple LoRA:
```bash
python test_lora_standalone.py --brand-id apple
```

### Test Cheezious LoRA:
```bash
python test_lora_standalone.py --brand-id cheezious
```

### Test with Custom Prompt:
```bash
python test_lora_standalone.py --brand-id apple --prompt "your custom prompt here"
```

## Options

```bash
python test_lora_standalone.py --help
```

**Available options:**
- `--brand-id` (required): Brand ID (e.g., apple, cheezious)
- `--prompt`: Custom prompt (optional, uses default prompts if not provided)
- `--output-dir`: Output directory (default: `test_output`)
- `--device`: Device to use - `cuda` or `cpu` (auto-detects if not specified)
- `--steps`: Number of inference steps (default: 35)
- `--guidance`: Guidance scale (default: 8.5)
- `--weight`: LoRA weight (default: 1.0)

## Examples

### Test Apple LoRA with default prompts:
```bash
python test_lora_standalone.py --brand-id apple
```

### Test Cheezious LoRA with custom settings:
```bash
python test_lora_standalone.py --brand-id cheezious --steps 40 --guidance 9.0
```

### Test with custom prompt:
```bash
python test_lora_standalone.py --brand-id apple --prompt "professional product photography of a smartphone, apple_style, minimal design, white background"
```

### Force CPU usage:
```bash
python test_lora_standalone.py --brand-id apple --device cpu
```

## Output

Images are saved to `test_output/` directory (or your specified `--output-dir`):
```
test_output/
├── apple_product1.png
├── apple_product2.png
├── cheezious_burger.png
├── cheezious_pizza.png
└── ...
```

## What It Does

1. **Finds your LoRA file** automatically:
   - Looks in `loras/{brand_id}/style.safetensors`
   - Also tries `loras/{brand_id}_style_lora/`

2. **Loads the model** with:
   - DPMSolverMultistepScheduler (better quality)
   - Same settings as your script

3. **Loads LoRA** using:
   - `adapter_name` parameter
   - `set_adapters()` method (matches your script)

4. **Generates test images** with:
   - Brand-specific prompts (includes `{brand_id}_style` keyword)
   - High quality settings (35 steps, 8.5 guidance)
   - Full LoRA weight (1.0)

## Default Prompts

### Apple:
- Product photography prompts
- Minimal, clean aesthetic
- Premium quality keywords

### Cheezious:
- Food photography prompts
- Burger, pizza, fries, sandwich
- Restaurant quality keywords

### Other Brands:
- Generic product/marketing prompts
- Brand style keywords included

## Troubleshooting

### LoRA Not Found:
```
❌ ERROR: LoRA file not found for brand_id: cheezious
```

**Solution:**
- Check LoRA file exists: `loras/cheezious/style.safetensors`
- Or: `loras/cheezious_style_lora/cheezious_style.safetensors`
- Verify brand_id matches directory name

### CUDA Not Available:
```
UserWarning: CUDA is not available. Disabling
```

**Solution:**
- Use `--device cpu` flag
- Or install CUDA-compatible PyTorch

### Out of Memory:
```
RuntimeError: CUDA out of memory
```

**Solution:**
- Use `--device cpu` flag
- Reduce image size (modify script to use 384x384)

## Comparison with Service

This script uses **exactly the same approach** as your working script:
- ✅ DPMSolverMultistepScheduler
- ✅ `adapter_name` parameter
- ✅ `set_adapters()` method
- ✅ Same inference settings

If this script works well, but the service doesn't, the issue is likely:
- LoRA file path mismatch
- Brand ID normalization
- Service not restarting after changes

## Next Steps

1. **Test your LoRA** with this script
2. **Verify images look good**
3. **Compare with service output**
4. **If different, check service logs** for LoRA loading messages

