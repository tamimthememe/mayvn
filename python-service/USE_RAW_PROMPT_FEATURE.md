# Use Raw Prompt Feature

## Overview

Added ability to use the user's raw prompt instead of the Qwen/Ollama-enhanced prompt for image generation. This allows you to bypass prompt enhancement if it's interfering with LoRA image generation.

## How It Works

### Frontend Changes:
1. **Stores Raw Prompt**: When you generate a prompt (Simple or Magic), the raw user input is stored separately in `backgroundAIRawPrompt`
2. **Checkbox Option**: A checkbox appears below the generated prompt allowing you to "Use Raw Prompt (Bypass Enhancement)"
3. **Automatic Detection**: Only shows the checkbox if a raw prompt exists and differs from the enhanced prompt

### API Changes:
1. **New Parameters**: API accepts `useRawPrompt` (boolean) and `rawPrompt` (string)
2. **Conditional Logic**: If `useRawPrompt` is true and `rawPrompt` is provided, uses raw prompt instead of enhanced

### Backend:
- Uses the same script logic (DPMSolverMultistepScheduler, adapter_name, set_adapters)
- Automatically adds `{brand_id}_style` keyword when LoRA is loaded
- Enhanced negative prompts for better quality

## Usage

### Step 1: Generate a Prompt
- Enter your prompt in the input field
- Click "Simple Prompt" or "Magic Prompt"
- The enhanced prompt is displayed

### Step 2: Choose Prompt Type
- If you used "Magic Prompt", you'll see a checkbox: "Use Raw Prompt (Bypass Enhancement)"
- Check the box to use your original prompt instead of the enhanced one
- Uncheck to use the enhanced prompt (default)

### Step 3: Generate Image
- Click "Generate Image"
- The system will use:
  - **Raw prompt** if checkbox is checked
  - **Enhanced prompt** if checkbox is unchecked (default)

## Why Use Raw Prompt?

The Qwen/Ollama prompt enhancement might:
- Add too many keywords that interfere with LoRA
- Change the meaning of your prompt
- Add conflicting style descriptions
- Make the prompt too long/complex

Using the raw prompt gives you:
- Direct control over what the model sees
- Better LoRA activation (with automatic `{brand_id}_style` keyword)
- Simpler, more focused prompts
- Results closer to your standalone script

## Technical Details

### Frontend Storage:
```typescript
// Stored in frame styles:
backgroundAIPrompt: string        // Enhanced prompt (from Qwen/Ollama)
backgroundAIRawPrompt: string     // Raw user input
useRawPromptForImage: boolean     // Toggle flag
```

### API Request:
```json
{
  "prompt": "enhanced prompt...",  // Always sent (for backward compatibility)
  "useRawPrompt": true,            // NEW: Flag to use raw
  "rawPrompt": "user's raw input", // NEW: Raw prompt
  "brandData": {...}
}
```

### Backend Processing:
```python
# In route.ts
if (useRawPrompt && rawPrompt) {
  finalPrompt = rawPrompt  // Use raw
} else {
  finalPrompt = prompt     // Use enhanced (default)
}

# Python service automatically adds {brand_id}_style keyword
# when LoRA is loaded
```

## Example

### User Input:
```
"a burger with cheese"
```

### Enhanced Prompt (Magic Prompt):
```
"professional food photography of a delicious burger, cheezious_style, melted cheese, fresh ingredients, appetizing, studio lighting, food advertisement, hyper-realistic, (8k ultra-detailed), macro lens, sharp focus, cinematic lighting, centered composition, soft shadows, shallow depth of field --neg blurry, --neg low-resolution..."
```

### Raw Prompt (if checkbox checked):
```
"a burger with cheese"
```

### What Gets Sent to Python Service:
- If checkbox checked: `"a burger with cheese, cheezious_style"` (raw + auto-added style keyword)
- If unchecked: Enhanced prompt (default)

## Benefits

1. **Better LoRA Control**: Raw prompts work better with LoRA adapters
2. **Simpler Prompts**: Less interference from enhancement
3. **Matches Script**: Same approach as your working standalone script
4. **Flexibility**: Choose per-image whether to use raw or enhanced

## Notes

- The `{brand_id}_style` keyword is **always** added automatically when LoRA is loaded
- Raw prompt still gets parsed for `--neg` negative prompts
- Default negative prompts are added if not provided
- All other settings (steps, guidance, scheduler) remain the same

