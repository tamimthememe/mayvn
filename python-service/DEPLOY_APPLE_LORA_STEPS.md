# Step-by-Step: Deploy Your Apple LoRA

## ✅ Step 1: Deployment Complete!

Your LoRA file has been successfully deployed:
- **Location**: `loras/apple/style.safetensors`
- **Size**: 18.11 MB
- **Brand ID**: `apple`

## 📋 Step 2: Restart the Python Service

**IMPORTANT**: You must restart the service for it to recognize the new LoRA.

### Option A: If service is running in a terminal
1. Go to the terminal where `python main.py` is running
2. Press `Ctrl+C` to stop it
3. Restart with: `python main.py`

### Option B: Start fresh
```powershell
cd mayvn\python-service
python main.py
```

Wait for the service to start (you'll see "Application startup complete").

## 🧪 Step 3: Test Your LoRA

### Option 1: Quick Test Script (Easiest)
```powershell
python test_lora.py
```

### Option 2: Test via API (PowerShell)
```powershell
$body = @{
    prompt = "a premium product showcase, minimal design, clean aesthetic"
    width = 512
    height = 512
    brand_id = "apple"
    lora_weights = 0.8
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/generate-async" -Method POST -Body $body -ContentType "application/json"
```

### Option 3: Test via Frontend
1. Open your frontend application
2. Go to the post generator page
3. Select or enter brand ID: `apple`
4. Generate an image
5. The LoRA should automatically apply!

## ✅ Step 4: Verify LoRA is Working

Check the service logs when generating. You should see:
```
INFO:lora_manager:[LORA] Found LoRA at: loras\apple\style.safetensors
INFO:lora_manager:[LORA] Loading LoRA: loras\apple\style.safetensors with weight: 0.8
INFO:lora_manager:[LORA] LoRA loaded successfully for brand: apple
```

If you see warnings like "No LoRA found", check:
- ✅ Service was restarted after deployment
- ✅ Brand ID matches exactly: `apple`
- ✅ File exists at `loras/apple/style.safetensors`

## 🎨 Step 5: Adjust LoRA Weight (Optional)

If the brand style is too strong or too weak, adjust the weight:

- **Too strong** (overfitted): Lower weight to `0.5-0.6`
- **Too weak** (not noticeable): Increase weight to `0.9-1.0`
- **Just right**: Keep at `0.7-0.8` (default)

Example request with custom weight:
```json
{
  "prompt": "a premium product showcase",
  "brand_id": "apple",
  "lora_weights": 0.6
}
```

## 📊 Step 6: Check Deployment Status

List all deployed LoRAs:
```powershell
python deploy_lora.py --list
```

## 🎉 You're Done!

Your Apple brand LoRA is now deployed and ready to use!

**Next Steps:**
- Train more LoRAs for other brands
- Use Phase 3 to combine multiple LoRAs
- Fine-tune weights for different use cases

