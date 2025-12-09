"""
Image Generation Service
FastAPI service for generating images using Stable Diffusion

Phase 5: Stable Diffusion integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import base64
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv
import torch
from diffusers import StableDiffusionPipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Image Generation Service",
    description="Service for generating images from prompts using Stable Diffusion",
    version="0.1.0"
)

# CORS middleware - allow requests from Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default port
        "http://localhost:3001",  # Alternative Next.js port
        os.getenv("NEXTJS_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class GenerateRequest(BaseModel):
    """Request model for image generation"""
    prompt: str = Field(..., description="Positive prompt for image generation")
    negative_prompt: Optional[str] = Field(
        default="blurry, low-resolution, distorted, text, watermark, logo, brand mark, signature",
        description="Negative prompt (things to avoid in the image)"
    )
    width: int = Field(default=1024, ge=256, le=2048, description="Image width in pixels")
    height: int = Field(default=1024, ge=256, le=2048, description="Image height in pixels")
    num_inference_steps: int = Field(default=50, ge=1, le=100, description="Number of inference steps")


class GenerateResponse(BaseModel):
    """Response model for image generation"""
    success: bool
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    message: Optional[str] = None
    mock: bool = False  # Phase 5: Real image generation
    device: Optional[str] = None  # Device used (cuda/cpu)


def create_placeholder_image(width: int, height: int) -> Image.Image:
    """
    Create a placeholder image for Phase 4 testing
    
    Args:
        width: Image width
        height: Image height
    
    Returns:
        PIL Image object
    """
    # Create a simple gradient placeholder image
    img = Image.new('RGB', (width, height), color='#4A90E2')
    
    # Add some text to indicate it's a placeholder
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        # Try to use a larger font
        font_size = min(width, height) // 10
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.load_default()
        except:
            font = None
    
    text = f"Image Generation\nComing Soon\n{width}x{height}"
    bbox = draw.textbbox((0, 0), text, font=font) if font else (0, 0, 100, 50)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((width - text_width) // 2, (height - text_height) // 2)
    draw.text(position, text, fill='white', font=font)
    
    return img


def image_to_base64(image: Image.Image) -> str:
    """
    Convert PIL Image to base64 string
    
    Args:
        image: PIL Image object
    
    Returns:
        Base64 encoded string
    """
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


# Global variable to store the pipeline
pipe = None
device = None


def load_stable_diffusion_model():
    """
    Load Stable Diffusion model at startup
    
    Step 5.1: Load model once and reuse for all requests
    """
    global pipe, device
    
    try:
        # Detect device (GPU if available, else CPU)
        if torch.cuda.is_available():
            device = "cuda"
            torch_dtype = torch.float16  # Use half precision for GPU
            logger.info(f"[IMAGE-GEN] CUDA available. Using GPU: {torch.cuda.get_device_name(0)}")
        else:
            device = "cpu"
            torch_dtype = torch.float32  # Use full precision for CPU
            logger.info("[IMAGE-GEN] CUDA not available. Using CPU (will be slower)")
        
        # Model name - using Stable Diffusion 1.5 (smaller, faster)
        model_name = os.getenv("SD_MODEL", "runwayml/stable-diffusion-v1-5")
        
        logger.info(f"[IMAGE-GEN] Loading Stable Diffusion model: {model_name}")
        logger.info("[IMAGE-GEN] This may take a few minutes on first run...")
        
        # Load the pipeline
        pipe = StableDiffusionPipeline.from_pretrained(
            model_name,
            torch_dtype=torch_dtype,
            safety_checker=None,  # Disable safety checker for faster generation
            requires_safety_checker=False
        )
        
        # Move to device
        pipe = pipe.to(device)
        
        # Enable memory efficient attention if available
        try:
            pipe.enable_attention_slicing()
            logger.info("[IMAGE-GEN] Enabled attention slicing for memory efficiency")
        except:
            pass
        
        # Enable xformers memory efficient attention if available (faster)
        try:
            pipe.enable_xformers_memory_efficient_attention()
            logger.info("[IMAGE-GEN] Enabled xformers memory efficient attention")
        except:
            logger.info("[IMAGE-GEN] xformers not available, using default attention")
        
        logger.info("[IMAGE-GEN] Model loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"[IMAGE-GEN] Error loading model: {str(e)}")
        logger.error("[IMAGE-GEN] Falling back to placeholder mode")
        pipe = None
        device = None
        return False


@app.on_event("startup")
async def startup_event():
    """Load model when service starts"""
    logger.info("[IMAGE-GEN] Starting up...")
    load_stable_diffusion_model()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Image Generation Service",
        "status": "running",
        "version": "0.2.0",
        "phase": 5,
        "model_loaded": pipe is not None,
        "device": device if device else "none",
        "description": "Stable Diffusion integration - real image generation"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "image-generation"}


@app.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """
    Generate an image from a text prompt using Stable Diffusion
    
    Phase 5: Real image generation with Stable Diffusion
    
    Args:
        request: GenerateRequest with prompt and parameters
    
    Returns:
        GenerateResponse with generated image (base64 or URL)
    """
    try:
        logger.info(f"[IMAGE-GEN] Received generation request:")
        logger.info(f"  Prompt: {request.prompt[:100]}...")
        logger.info(f"  Negative prompt: {request.negative_prompt[:100] if request.negative_prompt else 'None'}...")
        logger.info(f"  Dimensions: {request.width}x{request.height}")
        logger.info(f"  Steps: {request.num_inference_steps}")
        
        # Step 5.2 & 5.3: Generate image with Stable Diffusion
        if pipe is None:
            logger.warning("[IMAGE-GEN] Model not loaded, using placeholder")
            # Fallback to placeholder if model failed to load
            generated_image = create_placeholder_image(request.width, request.height)
            return GenerateResponse(
                success=True,
                image_base64=image_to_base64(generated_image),
                image_url=None,
                message="Model not loaded - placeholder image (check logs)",
                mock=True,
                device=device
            )
        
        logger.info(f"[IMAGE-GEN] Generating image on {device}...")
        
        # Generate image with Stable Diffusion
        with torch.no_grad():  # Disable gradient computation for inference
            result = pipe(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt or "",
                width=request.width,
                height=request.height,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=7.5,  # How closely to follow the prompt
            )
        
        # Extract the generated image
        generated_image = result.images[0]
        
        logger.info(f"[IMAGE-GEN] Image generated successfully ({request.width}x{request.height})")
        
        # Convert to base64
        image_base64 = image_to_base64(generated_image)
        
        return GenerateResponse(
            success=True,
            image_base64=image_base64,
            image_url=None,  # Will be used when uploading to storage in Phase 7
            message="Image generated successfully",
            mock=False,
            device=device
        )
        
    except torch.cuda.OutOfMemoryError:
        logger.error("[IMAGE-GEN] CUDA out of memory error")
        raise HTTPException(
            status_code=500,
            detail="GPU out of memory. Try reducing image dimensions or inference steps."
        )
    except Exception as e:
        logger.error(f"[IMAGE-GEN] Error generating image: {str(e)}")
        logger.exception(e)  # Log full traceback
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate image: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"[IMAGE-GEN] Starting Image Generation Service on {host}:{port}")
    logger.info(f"[IMAGE-GEN] Phase 5: Stable Diffusion integration")
    logger.info(f"[IMAGE-GEN] API docs available at: http://{host}:{port}/docs")
    logger.info(f"[IMAGE-GEN] Model will be loaded on startup...")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

