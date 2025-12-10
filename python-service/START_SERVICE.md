# How to Start the Python Image Generation Service

## Quick Start

### Step 1: Open a New Terminal
**Important:** Keep this terminal open - the service needs to keep running!

### Step 2: Navigate to Python Service Directory
```bash
cd mayvn/python-service
```

### Step 3: Activate Virtual Environment (if you have one)
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### Step 4: Start the Service
```bash
python main.py
```

### Step 5: Wait for Service to Start
You should see output like:
```
[IMAGE-GEN] Starting Image Generation Service...
[IMAGE-GEN] Loading Stable Diffusion model...
[IMAGE-GEN] Model loaded successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**⏳ Important:** Wait until you see "Model loaded successfully!" before trying to generate images.

## Verify Service is Running

Open a new terminal and test:
```bash
curl http://localhost:8000/health
```

Or visit in your browser: http://localhost:8000/

You should see:
```json
{"status": "healthy", "service": "image-generation"}
```

## Troubleshooting

### Port 8000 Already in Use
If you get an error about port 8000 being in use:
1. Find what's using it: `netstat -ano | findstr :8000` (Windows)
2. Kill the process or change the port in `.env` file:
   ```
   PORT=8001
   ```
3. Update Next.js `.env.local`:
   ```
   PYTHON_SERVICE_URL=http://localhost:8001
   ```

### Service Starts but Model Doesn't Load
- Check if you have enough disk space (model is ~4GB)
- Check internet connection (model downloads on first run)
- Look for error messages in the terminal

### Service Crashes on Startup
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (needs 3.8+)
- Check for error messages in the terminal

## Keep Service Running

**Important:** The terminal where you started the service must stay open. If you close it, the service stops.

To run in background (optional):
- Windows: Use `start python main.py` in a new window
- Or use a process manager like PM2


