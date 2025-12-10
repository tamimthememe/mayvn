# How to Restart the Python Service

## Issue: Service is Running But Not Responding

If you see connection timeouts, the service might be stuck. Here's how to fix it:

## Step 1: Stop All Python Service Instances

### Windows:
1. Open PowerShell or Command Prompt as Administrator
2. Find processes using port 8000:
   ```powershell
   netstat -ano | findstr :8000
   ```
3. Kill the processes (replace PID with the number from step 2):
   ```powershell
   taskkill /PID <PID> /F
   ```
   
   Or kill all Python processes (be careful - this kills ALL Python processes):
   ```powershell
   taskkill /IM python.exe /F
   ```

### Alternative: Use Task Manager
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Go to "Details" tab
3. Find `python.exe` processes
4. Right-click → End Task

## Step 2: Wait a Few Seconds
Give the ports time to be released (5-10 seconds)

## Step 3: Start the Service Fresh
```bash
cd mayvn\python-service
python main.py
```

## Step 4: Verify It's Working
Wait for:
```
[IMAGE-GEN] Model loaded successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Then test:
- Browser: http://localhost:8000/
- Should see: `{"status": "healthy", "service": "image-generation"}`

## Common Issues

### Multiple Instances Running
If you see multiple LISTENING entries in netstat, kill all of them and restart.

### Port Still in Use
If port 8000 is still in use after killing processes:
1. Wait 30 seconds
2. Try again
3. Or change port in `.env` file to 8001

### Service Crashes on Startup
Check the terminal for error messages. Common issues:
- Missing dependencies: `pip install -r requirements.txt`
- Model download issues: Check internet connection
- Memory issues: Close other applications


