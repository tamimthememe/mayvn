# Presentation Mode - Temporary Change

## What Was Changed

**Temporary modification for presentation purposes:**

- **Magic Prompt** now shows the **enhanced prompt** in the UI (looks good for demo)
- But **behind the scenes**, it uses the **raw prompt** for image generation (better results)

## How It Works

1. User clicks "Magic Prompt"
2. Enhanced prompt is displayed in the UI (what you see)
3. Raw prompt is stored separately (hidden)
4. When generating image:
   - UI shows: Enhanced prompt
   - Actually uses: Raw prompt (behind the scenes)

## Code Location

**File**: `mayvn/app/post-generator/page.tsx`
**Function**: `generateImage()`
**Line**: ~737-750

```typescript
// TEMPORARY: If raw prompt exists and differs from enhanced, use raw by default
// This makes Magic Prompt show enhanced in UI but use raw for generation
const shouldUseRaw = rawPrompt && 
                    rawPrompt !== selectedFrame.styles.backgroundAIPrompt &&
                    (useRawPrompt || true) // TEMPORARY: Always true for presentation
```

## To Revert Later

Change this line:
```typescript
(useRawPrompt || true) // TEMPORARY: Always true for presentation
```

Back to:
```typescript
useRawPrompt // Use checkbox setting
```

Or remove the temporary logic entirely and use the checkbox approach.

## Benefits for Presentation

✅ **Looks professional**: Shows enhanced prompts in UI
✅ **Better results**: Uses raw prompts for generation (better LoRA activation)
✅ **No confusion**: Audience sees enhanced prompts, but you get better images

## After Presentation

1. Revert the temporary change
2. Use checkbox approach for flexibility
3. Or keep it if you prefer this behavior

