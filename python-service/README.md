# Image Generation Service

FastAPI service for generating images from text prompts using Stable Diffusion.

## Phase 5: Stable Diffusion Integration (Current)

This service now includes full Stable Diffusion integration for real image generation.

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Navigate to the service directory:
```bash
cd python-service
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

The service will start on `http://localhost:8000`

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Health Check
```
GET /
GET /health
```

### Generate Image
```
POST /generate
```

**Request Body:**
```json
{
  "prompt": "a beautiful sunset over mountains",
  "negative_prompt": "blurry, low-resolution, text",
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 50
}
```

**Response:**
```json
{
  "success": true,
  "image_base64": "data:image/png;base64,...",
  "image_url": null,
  "message": "Image generated successfully",
  "mock": false,
  "device": "cuda"
}
```

## Testing

### Using curl

```bash
curl -X POST "http://localhost:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful landscape",
    "width": 1024,
    "height": 1024
  }'
```

### Using Python

```python
import requests

response = requests.post(
    "http://localhost:8000/generate",
    json={
        "prompt": "a beautiful landscape",
        "width": 1024,
        "height": 1024
    }
)

data = response.json()
print(data["success"])
```

## Environment Variables

Create a `.env` file in the `python-service` directory:

```env
# Server configuration
PORT=8000
HOST=0.0.0.0

# Next.js app URL (for CORS)
NEXTJS_URL=http://localhost:3000
```

## Project Structure

```
python-service/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── .env                # Environment variables (create this)
└── venv/               # Virtual environment (created during setup)
```

## Installation Notes

### First Time Setup

1. **Install dependencies** (this will download large packages):
```bash
pip install -r requirements.txt
```

2. **First run will download the model** (~4GB):
   - The Stable Diffusion model will be downloaded automatically on first startup
   - This happens in the background and may take 10-20 minutes depending on your internet speed
   - The model is cached locally after first download

### Hardware Requirements

- **GPU (Recommended)**: NVIDIA GPU with 8GB+ VRAM for fast generation
- **CPU (Supported)**: Will work but much slower (5-30 minutes per image)

### Environment Variables

Create a `.env` file:

```env
# Server configuration
PORT=8000
HOST=0.0.0.0

# Next.js app URL (for CORS)
NEXTJS_URL=http://localhost:3000

# Stable Diffusion model (optional)
# SD_MODEL=runwayml/stable-diffusion-v1-5  # Default
# SD_MODEL=stabilityai/stable-diffusion-xl-base-1.0  # SDXL (requires more VRAM)
```

## Next Steps (Phase 6)

- [ ] Connect to Next.js API route
- [ ] Upload generated images to Firebase Storage
- [ ] Add image caching and optimization

## Notes

- This service runs independently from the Next.js app
- It communicates via HTTP REST API
- CORS is configured to allow requests from localhost:3000
- The service can be deployed separately in production

