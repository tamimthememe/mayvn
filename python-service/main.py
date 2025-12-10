"""
Image Generation Service
FastAPI service for generating images using Stable Diffusion

Phase 5: Stable Diffusion integration
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import base64
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import logging
import uuid
import threading
from datetime import datetime
from enum import Enum
from lora_manager import (
    load_lora_weights, unload_lora_weights, ensure_lora_directory, LORA_BASE_DIR,
    save_brand_metadata, get_brand_id_from_data, normalize_brand_id,
    preload_loras, get_cache_stats, clear_cache,  # Phase 2: Cache functions
    load_multiple_lora_weights, get_lora_metadata, list_available_loras  # Phase 3: Multiple LoRA support
)

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

class LoRAConfig(BaseModel):
    """Phase 3: Configuration for a single LoRA adapter"""
    brand_id: str = Field(..., description="Brand identifier for the LoRA adapter")
    weight: float = Field(default=0.8, ge=0.0, le=1.0, description="LoRA weight/strength (0.0-1.0)")
    type: Optional[str] = Field(
        default=None,
        description="LoRA type: 'style', 'product', 'photography', etc. (for organization)"
    )


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
    
    # Phase 1 & 2: Single LoRA support (backward compatible)
    brand_id: Optional[str] = Field(
        default=None,
        description="[DEPRECATED: Use lora_configs] Brand identifier for loading brand-specific LoRA adapter (optional)"
    )
    lora_weights: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="[DEPRECATED: Use lora_configs] LoRA weight/strength (0.0-1.0), default 0.8. Only used if brand_id is provided."
    )
    brand_data: Optional[dict] = Field(
        default=None,
        description="Brand DNA data (optional, used for metadata storage and brand_id extraction)"
    )
    
    # Phase 3: Multiple LoRA support
    lora_configs: Optional[List[LoRAConfig]] = Field(
        default=None,
        description="List of LoRA configurations to apply. Multiple LoRAs will be composed together."
    )
    
    # Phase 3: A/B testing support
    test_weights: bool = Field(
        default=False,
        description="If true, generate multiple variations with different weight combinations"
    )
    weight_variations: Optional[List[float]] = Field(
        default=None,
        description="List of weight values to test (e.g., [0.6, 0.7, 0.8, 0.9]). Only used if test_weights=true."
    )


class GenerateResponse(BaseModel):
    """Response model for image generation"""
    success: bool
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    message: Optional[str] = None
    mock: bool = False  # Phase 5: Real image generation
    device: Optional[str] = None  # Device used (cuda/cpu)


class JobResponse(BaseModel):
    """Response model for async job creation"""
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    """Response model for job status check"""
    job_id: str
    status: str
    progress: Optional[float] = None
    result: Optional[GenerateResponse] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str


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

# Job storage (in-memory, for production consider Redis or database)
jobs: Dict[str, Dict] = {}
jobs_lock = threading.Lock()


class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


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
        
        # Use DPMSolverMultistepScheduler for better quality (matches script)
        pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
        logger.info("[IMAGE-GEN] Using DPMSolverMultistepScheduler for better quality")
        
        # Move to device
        pipe = pipe.to(device)
        
        # Enable memory efficient attention if available
        try:
            pipe.enable_attention_slicing()
            logger.info("[IMAGE-GEN] Enabled attention slicing for memory efficiency")
        except:
            pass
        
        # Enable xformers memory efficient attention if available (faster, GPU only)
        if device == "cuda":
            try:
                pipe.enable_xformers_memory_efficient_attention()
                logger.info("[IMAGE-GEN] Enabled xformers memory efficient attention")
            except:
                logger.info("[IMAGE-GEN] xformers not available, using default attention")
        
        # For CPU, enable sequential CPU offloading to reduce memory usage
        if device == "cpu":
            try:
                pipe.enable_sequential_cpu_offload()
                logger.info("[IMAGE-GEN] Enabled sequential CPU offloading (reduces memory usage)")
            except Exception as e:
                logger.warning(f"[IMAGE-GEN] Could not enable CPU offloading: {str(e)}")
        
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
    # Ensure LoRA directory exists
    ensure_lora_directory()
    # Load base model
    load_stable_diffusion_model()
    
    # Phase 2: Preload popular LoRAs if configured
    preload_brands = os.getenv("LORA_PRELOAD_BRANDS", "").strip()
    if preload_brands and pipe is not None:
        brand_list = [b.strip() for b in preload_brands.split(",") if b.strip()]
        if brand_list:
            logger.info(f"[IMAGE-GEN] Preloading {len(brand_list)} LoRAs: {brand_list}")
            preload_results = preload_loras(pipe, brand_list)
            successful = sum(1 for v in preload_results.values() if v)
            logger.info(f"[IMAGE-GEN] Preloaded {successful}/{len(brand_list)} LoRAs successfully")


@app.get("/")
async def root():
    """Health check endpoint"""
    cache_stats = get_cache_stats()
    return {
        "service": "Image Generation Service",
        "status": "running",
        "version": "0.3.0",
        "phase": 5,
        "model_loaded": pipe is not None,
        "device": device if device else "none",
        "lora_support": True,
        "lora_directory": LORA_BASE_DIR,
        "lora_cache": cache_stats,  # Phase 2: Include cache stats
        "description": "Stable Diffusion integration with LoRA support for brand-specific generation"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "image-generation"}


def process_image_generation(job_id: str, request: GenerateRequest):
    """
    Background task to generate image
    This runs in a separate thread to avoid blocking the API
    """
    global pipe, device
    
    try:
        with jobs_lock:
            jobs[job_id]["status"] = JobStatus.PROCESSING
            jobs[job_id]["updated_at"] = datetime.now().isoformat()
        
        logger.info(f"[JOB-{job_id}] Starting image generation...")
        
        # Adjust dimensions for CPU
        adjusted_width = request.width
        adjusted_height = request.height
        
        if device == "cpu":
            aspect_ratio = request.width / request.height
            if request.width > 512 or request.height > 512:
                if aspect_ratio >= 1:
                    adjusted_width = 512
                    adjusted_height = int(512 / aspect_ratio)
                else:
                    adjusted_height = 512
                    adjusted_width = int(512 * aspect_ratio)
                adjusted_width = (adjusted_width // 8) * 8
                adjusted_height = (adjusted_height // 8) * 8
                logger.info(f"[JOB-{job_id}] CPU: Reduced dimensions to {adjusted_width}x{adjusted_height}")
        
        # Phase 3: Handle multiple LoRA configs OR single brand_id (backward compatibility)
        lora_loaded = False
        
        if request.lora_configs and len(request.lora_configs) > 0:
            # Phase 3: Multiple LoRA support
            try:
                logger.info(f"[JOB-{job_id}] Loading {len(request.lora_configs)} LoRAs for composition...")
                lora_configs_list = [{"brand_id": cfg.brand_id, "weight": cfg.weight, "type": cfg.type} for cfg in request.lora_configs]
                pipe = load_multiple_lora_weights(pipe, lora_configs_list)
                lora_loaded = True
            except Exception as e:
                logger.warning(f"[JOB-{job_id}] Failed to load multiple LoRAs: {str(e)}")
        else:
            # Phase 1 & 2: Single LoRA support (backward compatible)
            final_brand_id = request.brand_id
            if not final_brand_id and request.brand_data is not None:
                try:
                    final_brand_id = get_brand_id_from_data(request.brand_data)
                except Exception as e:
                    logger.warning(f"[JOB-{job_id}] Failed to extract brand_id: {str(e)}")
            
            # Save brand metadata
            if request.brand_data is not None:
                try:
                    save_brand_id = final_brand_id or get_brand_id_from_data(request.brand_data)
                    if save_brand_id:
                        save_brand_metadata(save_brand_id, request.brand_data)
                except Exception as e:
                    logger.warning(f"[JOB-{job_id}] Failed to save brand metadata: {str(e)}")
            
            # Load single LoRA if needed
            if final_brand_id:
                try:
                    normalized_brand_id = normalize_brand_id(final_brand_id)
                    pipe = load_lora_weights(pipe, normalized_brand_id, request.lora_weights)
                    lora_loaded = True
                except Exception as e:
                    logger.warning(f"[JOB-{job_id}] Failed to load LoRA: {str(e)}")
        
        # Generate image
        if pipe is None:
            raise Exception("Model not loaded")
        
        logger.info(f"[JOB-{job_id}] Generating image on {device}...")
        
        # Enhance prompt with brand style keywords if LoRA is loaded
        enhanced_prompt = request.prompt
        final_brand_id_for_prompt = None
        
        if request.lora_configs and len(request.lora_configs) > 0:
            # Use first LoRA's brand_id for prompt enhancement
            final_brand_id_for_prompt = request.lora_configs[0].brand_id
        elif request.brand_id:
            final_brand_id_for_prompt = request.brand_id
        elif request.brand_data:
            try:
                final_brand_id_for_prompt = get_brand_id_from_data(request.brand_data)
            except:
                pass
        
        if lora_loaded and final_brand_id_for_prompt:
            # Add brand style trigger to prompt for better LoRA activation
            normalized_id = normalize_brand_id(final_brand_id_for_prompt)
            # Add brand style keyword (e.g., "apple_style") to prompt
            if f"{normalized_id}_style" not in enhanced_prompt.lower():
                enhanced_prompt = f"{enhanced_prompt}, {normalized_id}_style"
                logger.info(f"[JOB-{job_id}] Enhanced prompt with brand style keyword: {normalized_id}_style")
        
        # Enhanced negative prompt for better quality
        enhanced_negative = request.negative_prompt or ""
        if not enhanced_negative or len(enhanced_negative) < 50:
            # Add comprehensive negative prompts if not provided
            default_negatives = "blurry, low quality, distorted, text, letters, words, typography, watermark, ugly, amateur, cluttered, busy background, low resolution, oversaturated, poorly lit, bad composition"
            enhanced_negative = enhanced_negative + (", " + default_negatives if enhanced_negative else default_negatives)
        
        with torch.no_grad():
            result = pipe(
                prompt=enhanced_prompt,
                negative_prompt=enhanced_negative,
                width=adjusted_width,
                height=adjusted_height,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=8.5,  # Higher guidance for stronger prompt adherence (increased from 7.5)
            )
        
        # Unload LoRA
        if lora_loaded:
            try:
                unload_lora_weights(pipe)
            except Exception as e:
                logger.warning(f"[JOB-{job_id}] Error unloading LoRA: {str(e)}")
        
        # Extract and process image
        generated_image = result.images[0]
        
        if device == "cpu" and (adjusted_width != request.width or adjusted_height != request.height):
            logger.info(f"[JOB-{job_id}] Upscaling to {request.width}x{request.height}")
            generated_image = generated_image.resize((request.width, request.height), Image.Resampling.LANCZOS)
        
        # Convert to base64
        image_base64 = image_to_base64(generated_image)
        
        # Update job with result
        with jobs_lock:
            jobs[job_id]["status"] = JobStatus.COMPLETED
            jobs[job_id]["result"] = GenerateResponse(
                success=True,
                image_base64=image_base64,
                image_url=None,
                message="Image generated successfully",
                mock=False,
                device=device
            )
            jobs[job_id]["updated_at"] = datetime.now().isoformat()
        
        logger.info(f"[JOB-{job_id}] Image generation completed successfully")
        
    except Exception as e:
        logger.error(f"[JOB-{job_id}] Error generating image: {str(e)}")
        logger.exception(e)
        with jobs_lock:
            jobs[job_id]["status"] = JobStatus.FAILED
            jobs[job_id]["error"] = str(e)
            jobs[job_id]["updated_at"] = datetime.now().isoformat()


@app.post("/generate-async", response_model=JobResponse)
async def generate_image_async(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate image asynchronously - returns job ID immediately
    
    Use this endpoint for long-running generations to avoid timeouts.
    Poll /job/{job_id}/status to check progress.
    """
    # Create job
    job_id = str(uuid.uuid4())
    
    with jobs_lock:
        jobs[job_id] = {
            "job_id": job_id,
            "status": JobStatus.PENDING,
            "request": request,
            "result": None,
            "error": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
    
    # Start background task
    background_tasks.add_task(process_image_generation, job_id, request)
    
    logger.info(f"[JOB-{job_id}] Created async job for prompt: {request.prompt[:50]}...")
    
    return JobResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        message="Job created. Use /job/{job_id}/status to check progress."
    )


@app.get("/job/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of an async image generation job"""
    with jobs_lock:
        if job_id not in jobs:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = jobs[job_id]
    
    return JobStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        result=job["result"],
        error=job["error"],
        created_at=job["created_at"],
        updated_at=job["updated_at"]
    )


@app.get("/lora/cache/stats")
async def get_lora_cache_stats():
    """Phase 2: Get LoRA cache statistics"""
    return get_cache_stats()


@app.post("/lora/cache/clear")
async def clear_lora_cache():
    """Phase 2: Clear the LoRA cache"""
    clear_cache()
    return {"message": "LoRA cache cleared successfully", "stats": get_cache_stats()}


@app.get("/lora/list")
async def list_loras():
    """Phase 3: List all available LoRAs with their metadata"""
    loras = list_available_loras()
    return {
        "count": len(loras),
        "loras": loras
    }


@app.get("/lora/{brand_id}/metadata")
async def get_lora_metadata_endpoint(brand_id: str):
    """Phase 3: Get metadata for a specific LoRA"""
    metadata = get_lora_metadata(brand_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail=f"LoRA metadata not found for brand_id: {brand_id}")
    return metadata


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
    global pipe, device  # Declare global variables to modify them
    try:
        logger.info(f"[IMAGE-GEN] Received generation request:")
        logger.info(f"  Prompt: {request.prompt[:100]}...")
        logger.info(f"  Negative prompt: {request.negative_prompt[:100] if request.negative_prompt else 'None'}...")
        logger.info(f"  Requested dimensions: {request.width}x{request.height}")
        logger.info(f"  Steps: {request.num_inference_steps}")
        
        # Adjust dimensions for CPU to prevent out-of-memory errors
        # CPU has limited memory, so we need to reduce dimensions
        adjusted_width = request.width
        adjusted_height = request.height
        
        if device == "cpu":
            # For CPU, limit to 512x512 to prevent OOM errors
            # Calculate aspect ratio to maintain it
            aspect_ratio = request.width / request.height
            
            if request.width > 512 or request.height > 512:
                if aspect_ratio >= 1:
                    # Landscape or square
                    adjusted_width = 512
                    adjusted_height = int(512 / aspect_ratio)
                else:
                    # Portrait
                    adjusted_height = 512
                    adjusted_width = int(512 * aspect_ratio)
                
                # Ensure dimensions are multiples of 8 (required by Stable Diffusion)
                adjusted_width = (adjusted_width // 8) * 8
                adjusted_height = (adjusted_height // 8) * 8
                
                logger.warning(f"[IMAGE-GEN] CPU detected: Reducing dimensions from {request.width}x{request.height} to {adjusted_width}x{adjusted_height} to prevent OOM")
        
        logger.info(f"  Final dimensions: {adjusted_width}x{adjusted_height}")
        
        # Phase 3: Handle multiple LoRA configs OR single brand_id (backward compatibility)
        lora_loaded = False
        
        if request.lora_configs and len(request.lora_configs) > 0:
            # Phase 3: Multiple LoRA support
            try:
                logger.info(f"[IMAGE-GEN] Loading {len(request.lora_configs)} LoRAs for composition...")
                lora_configs_list = [{"brand_id": cfg.brand_id, "weight": cfg.weight, "type": cfg.type} for cfg in request.lora_configs]
                pipe = load_multiple_lora_weights(pipe, lora_configs_list)
                lora_loaded = True
                logger.info(f"[IMAGE-GEN] Successfully loaded {len(request.lora_configs)} LoRAs")
            except Exception as e:
                logger.warning(f"[IMAGE-GEN] Failed to load multiple LoRAs: {str(e)}")
        else:
            # Phase 1 & 2: Single LoRA support (backward compatible)
            final_brand_id = request.brand_id
            if not final_brand_id and request.brand_data is not None:
                try:
                    final_brand_id = get_brand_id_from_data(request.brand_data)
                    if final_brand_id:
                        logger.info(f"  Brand ID extracted from brand_data: {final_brand_id}")
                except Exception as e:
                    logger.warning(f"[IMAGE-GEN] Failed to extract brand_id from brand_data: {str(e)}")
            
            # Save brand metadata if brand_data is provided
            if request.brand_data is not None:
                try:
                    # Use extracted or provided brand_id
                    save_brand_id = final_brand_id or get_brand_id_from_data(request.brand_data)
                    if save_brand_id:
                        save_brand_metadata(save_brand_id, request.brand_data)
                except Exception as e:
                    logger.warning(f"[IMAGE-GEN] Failed to save brand metadata (non-critical): {str(e)}")
            
            if final_brand_id:
                logger.info(f"  Brand ID: {final_brand_id} (LoRA weight: {request.lora_weights})")
            
            # Load single LoRA if needed
            if final_brand_id:
                try:
                    # Normalize brand_id for filesystem
                    normalized_brand_id = normalize_brand_id(final_brand_id)
                    # Load LoRA (modifies pipeline in place, returns it)
                    pipe = load_lora_weights(pipe, normalized_brand_id, request.lora_weights)
                    lora_loaded = True
                except Exception as e:
                    logger.warning(f"[IMAGE-GEN] Failed to load LoRA, continuing with base model: {str(e)}")
        
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
        try:
            with torch.no_grad():  # Disable gradient computation for inference
                # Enhance prompt with brand style keywords if LoRA is loaded
                enhanced_prompt = request.prompt
                if lora_loaded and final_brand_id:
                    # Add brand style trigger to prompt for better LoRA activation
                    normalized_id = normalize_brand_id(final_brand_id)
                    # Add brand style keyword (e.g., "apple_style") to prompt
                    if f"{normalized_id}_style" not in enhanced_prompt.lower():
                        enhanced_prompt = f"{enhanced_prompt}, {normalized_id}_style"
                
                # Enhanced negative prompt for better quality
                enhanced_negative = request.negative_prompt or ""
                if not enhanced_negative or len(enhanced_negative) < 50:
                    # Add comprehensive negative prompts if not provided
                    default_negatives = "blurry, low quality, distorted, text, letters, words, typography, watermark, ugly, amateur, cluttered, busy background, low resolution, oversaturated, poorly lit, bad composition"
                    enhanced_negative = enhanced_negative + (", " + default_negatives if enhanced_negative else default_negatives)
                
                result = pipe(
                    prompt=enhanced_prompt,
                    negative_prompt=enhanced_negative,
                    width=adjusted_width,
                    height=adjusted_height,
                    num_inference_steps=request.num_inference_steps,
                    guidance_scale=8.5,  # Higher guidance for stronger prompt adherence (increased from 7.5)
                )
        finally:
            # Unload LoRA after generation to return to base model state
            # This ensures the base pipeline remains clean for next request
            if lora_loaded:
                try:
                    # Unload LoRA (modifies pipeline in place)
                    unload_lora_weights(pipe)
                except Exception as e:
                    logger.warning(f"[IMAGE-GEN] Error unloading LoRA (non-critical): {str(e)}")
        
        # Extract the generated image
        generated_image = result.images[0]
        
        # Resize to requested dimensions if they were adjusted
        if device == "cpu" and (adjusted_width != request.width or adjusted_height != request.height):
            logger.info(f"[IMAGE-GEN] Upscaling image from {adjusted_width}x{adjusted_height} to {request.width}x{request.height}")
            generated_image = generated_image.resize((request.width, request.height), Image.Resampling.LANCZOS)
        
        logger.info(f"[IMAGE-GEN] Image generated successfully ({generated_image.width}x{generated_image.height})")
        
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

