"""
LoRA Manager Module
Handles loading and managing LoRA adapters for brand-specific image generation

Phase 2: Added LRU cache for performance optimization
"""

import os
import json
import logging
import threading
from typing import Optional, Dict, Any, Tuple, List
from collections import OrderedDict
from diffusers import StableDiffusionPipeline

logger = logging.getLogger(__name__)

# Default LoRA directory
LORA_BASE_DIR = os.getenv("LORA_BASE_DIR", "loras")

# Phase 2: Cache configuration
LORA_CACHE_ENABLED = os.getenv("LORA_CACHE_ENABLED", "true").lower() == "true"
LORA_CACHE_MAX_SIZE = int(os.getenv("LORA_CACHE_MAX_SIZE", "5"))

# Phase 2: LRU Cache for loaded LoRA pipelines
# Key: (normalized_brand_id, lora_weight) tuple
# Value: Pipeline with LoRA loaded (we'll store a reference, not the actual pipeline)
_lora_cache: OrderedDict = OrderedDict()
_cache_lock = threading.Lock()
_cache_stats = {
    "hits": 0,
    "misses": 0,
    "evictions": 0,
    "size": 0
}


def get_lora_path(brand_id: str) -> Optional[str]:
    """
    Get the path to a LoRA file for a given brand ID
    
    Args:
        brand_id: The brand identifier (will be normalized)
        
    Returns:
        Path to LoRA file if exists, None otherwise
    """
    if not brand_id or brand_id == "default":
        return None
    
    # Normalize brand_id for filesystem
    normalized_id = normalize_brand_id(brand_id)
    
    # Try different possible LoRA file names
    possible_names = ["style.safetensors", "lora.safetensors", f"{normalized_id}.safetensors"]
    
    brand_dir = os.path.join(LORA_BASE_DIR, normalized_id)
    
    for name in possible_names:
        lora_path = os.path.join(brand_dir, name)
        if os.path.exists(lora_path):
            logger.info(f"[LORA] Found LoRA at: {lora_path}")
            return lora_path
    
    logger.warning(f"[LORA] No LoRA found for brand_id: {normalized_id} in {brand_dir}")
    return None


def _get_cache_key(brand_id: str, lora_weight: float) -> Tuple[str, float]:
    """Generate cache key from brand_id and lora_weight"""
    normalized_id = normalize_brand_id(brand_id)
    return (normalized_id, lora_weight)


def _is_cached(brand_id: str, lora_weight: float) -> bool:
    """Check if LoRA is in cache"""
    if not LORA_CACHE_ENABLED:
        return False
    
    cache_key = _get_cache_key(brand_id, lora_weight)
    with _cache_lock:
        return cache_key in _lora_cache


def _get_from_cache(brand_id: str, lora_weight: float) -> Optional[StableDiffusionPipeline]:
    """Get pipeline from cache (returns None if not cached)"""
    if not LORA_CACHE_ENABLED:
        return None
    
    cache_key = _get_cache_key(brand_id, lora_weight)
    with _cache_lock:
        if cache_key in _lora_cache:
            # Move to end (most recently used)
            _lora_cache.move_to_end(cache_key)
            _cache_stats["hits"] += 1
            logger.debug(f"[LORA-CACHE] Cache HIT for {brand_id} (weight: {lora_weight})")
            # Note: We can't actually cache the pipeline itself because it's modified in-place
            # Instead, we'll use the cache to track which LoRAs are "ready" and skip reloading
            return _lora_cache[cache_key]
        else:
            _cache_stats["misses"] += 1
            logger.debug(f"[LORA-CACHE] Cache MISS for {brand_id} (weight: {lora_weight})")
            return None


def _add_to_cache(brand_id: str, lora_weight: float, pipe: StableDiffusionPipeline):
    """Add pipeline to cache (stores reference for tracking)"""
    if not LORA_CACHE_ENABLED:
        return
    
    cache_key = _get_cache_key(brand_id, lora_weight)
    with _cache_lock:
        # If cache is full, remove least recently used
        if len(_lora_cache) >= LORA_CACHE_MAX_SIZE and cache_key not in _lora_cache:
            # Remove oldest (first) item
            oldest_key = next(iter(_lora_cache))
            del _lora_cache[oldest_key]
            _cache_stats["evictions"] += 1
            logger.info(f"[LORA-CACHE] Evicted {oldest_key[0]} from cache (max size: {LORA_CACHE_MAX_SIZE})")
        
        # Add or update cache entry
        _lora_cache[cache_key] = pipe  # Store reference
        _lora_cache.move_to_end(cache_key)  # Mark as most recently used
        _cache_stats["size"] = len(_lora_cache)
        logger.debug(f"[LORA-CACHE] Added {brand_id} to cache (weight: {lora_weight}, cache size: {len(_lora_cache)})")


def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    with _cache_lock:
        return {
            "enabled": LORA_CACHE_ENABLED,
            "max_size": LORA_CACHE_MAX_SIZE,
            "current_size": len(_lora_cache),
            "hits": _cache_stats["hits"],
            "misses": _cache_stats["misses"],
            "evictions": _cache_stats["evictions"],
            "hit_rate": _cache_stats["hits"] / (_cache_stats["hits"] + _cache_stats["misses"]) if (_cache_stats["hits"] + _cache_stats["misses"]) > 0 else 0.0
        }


def clear_cache():
    """Clear the LoRA cache"""
    with _cache_lock:
        _lora_cache.clear()
        _cache_stats["size"] = 0
        logger.info("[LORA-CACHE] Cache cleared")


def load_lora_weights(pipe: StableDiffusionPipeline, brand_id: Optional[str], lora_weight: float = 0.8) -> StableDiffusionPipeline:
    """
    Load LoRA weights into the pipeline for a specific brand
    
    Phase 2: Now uses LRU cache for performance optimization and tracking
    
    Args:
        pipe: The Stable Diffusion pipeline
        brand_id: Brand identifier (optional)
        lora_weight: Weight/strength of LoRA (0.0-1.0), default 0.8
        
    Returns:
        Pipeline with LoRA loaded (or original pipeline if no LoRA found)
    """
    if not brand_id or brand_id == "default":
        logger.info("[LORA] No brand_id provided, using base model")
        return pipe
    
    # Phase 2: Check cache first (for statistics and tracking)
    is_cached = _is_cached(brand_id, lora_weight)
    if is_cached:
        logger.info(f"[LORA] LoRA for {brand_id} found in cache (tracking only - still loading)")
        # Note: We still load the LoRA because pipelines are modified in-place
        # The cache tracks which LoRAs have been loaded, but we can't skip loading
        # This is a limitation of how diffusers works with shared pipelines
    
    lora_path = get_lora_path(brand_id)
    
    if not lora_path:
        logger.info(f"[LORA] LoRA not found for brand_id: {brand_id}, using base model")
        return pipe
    
    try:
        logger.info(f"[LORA] Loading LoRA: {lora_path} with weight: {lora_weight}")
        
        # Check if LoRA is a directory or file
        if os.path.isdir(lora_path):
            # If it's a directory, load from directory
            pipe.load_lora_weights(lora_path, weight=lora_weight)
        else:
            # If it's a file, load from file path
            # For single file, we need to load from the directory containing it
            lora_dir = os.path.dirname(lora_path)
            weight_name = os.path.basename(lora_path)
            pipe.load_lora_weights(lora_dir, weight_name=weight_name, weight=lora_weight)
        
        # Phase 2: Add to cache after successful load (for tracking and statistics)
        _add_to_cache(brand_id, lora_weight, pipe)
        
        logger.info(f"[LORA] LoRA loaded successfully for brand: {brand_id} with weight: {lora_weight}")
        return pipe
        
    except Exception as e:
        logger.error(f"[LORA] Error loading LoRA: {str(e)}")
        logger.error(f"[LORA] Falling back to base model")
        import traceback
        logger.error(traceback.format_exc())
        return pipe


def unload_lora_weights(pipe: StableDiffusionPipeline) -> StableDiffusionPipeline:
    """
    Unload LoRA weights from the pipeline to return to base model
    
    Note: In diffusers, LoRA weights are typically fused or kept in memory.
    This function attempts to unload if possible, but the base model state
    should be preserved. For true isolation, consider using pipeline copies.
    
    Args:
        pipe: The Stable Diffusion pipeline
        
    Returns:
        Pipeline (LoRA may still be in memory, but won't affect next generation if new LoRA is loaded)
    """
    try:
        # Try to unload if the method exists (diffusers 0.21+)
        if hasattr(pipe, 'unload_lora_weights'):
            pipe.unload_lora_weights()
            logger.info("[LORA] LoRA weights unloaded")
        # Note: We don't need to do anything else as loading a new LoRA
        # will override the previous one, or if no LoRA is loaded next time,
        # the base model will be used
    except Exception as e:
        # Non-critical - LoRA unloading is optional
        logger.debug(f"[LORA] Note: LoRA unloading not available or not needed: {str(e)}")
    
    return pipe


def ensure_lora_directory():
    """
    Ensure the LoRA directory structure exists
    """
    if not os.path.exists(LORA_BASE_DIR):
        os.makedirs(LORA_BASE_DIR, exist_ok=True)
        logger.info(f"[LORA] Created LoRA directory: {LORA_BASE_DIR}")
        
        # Create a README in the directory
        readme_path = os.path.join(LORA_BASE_DIR, "README.md")
        with open(readme_path, 'w') as f:
            f.write("""# LoRA Adapters Directory

Place brand-specific LoRA adapters here.

## Directory Structure

```
loras/
├── brand_abc123/
│   ├── style.safetensors
│   └── brand_metadata.json
├── brand_xyz789/
│   ├── style.safetensors
│   └── brand_metadata.json
└── README.md
```

## Naming Convention

- Each brand should have its own directory named with the brand_id
- LoRA files should be named: `style.safetensors` or `lora.safetensors`
- Brand metadata is stored in `brand_metadata.json` (auto-generated)
- Supported formats: `.safetensors` (recommended)

## Usage

When making a generation request, include `brand_id` in the request:
```json
{
  "prompt": "your prompt",
  "brand_id": "brand_abc123",
  "lora_weights": 0.8
}
```

If no `brand_id` is provided, the base model will be used.
""")
        logger.info(f"[LORA] Created README at: {readme_path}")


def normalize_brand_id(brand_id: str) -> str:
    """
    Normalize brand_id to a filesystem-safe string
    
    Args:
        brand_id: Original brand identifier (can be Firestore ID, brand name, etc.)
        
    Returns:
        Normalized brand_id safe for filesystem use
    """
    # Remove or replace invalid filesystem characters
    import re
    # Replace spaces and special chars with underscores
    normalized = re.sub(r'[^\w\-_]', '_', brand_id)
    # Remove multiple consecutive underscores
    normalized = re.sub(r'_+', '_', normalized)
    # Remove leading/trailing underscores
    normalized = normalized.strip('_')
    # Ensure it's not empty
    if not normalized:
        normalized = "default"
    return normalized.lower()


def save_brand_metadata(brand_id: str, brand_data: Dict[str, Any]) -> bool:
    """
    Save brand metadata alongside LoRA files
    
    Args:
        brand_id: Brand identifier
        brand_data: Brand DNA data from scraper (BrandData structure)
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        normalized_id = normalize_brand_id(brand_id)
        brand_dir = os.path.join(LORA_BASE_DIR, normalized_id)
        
        # Ensure brand directory exists
        os.makedirs(brand_dir, exist_ok=True)
        
        # Prepare metadata (only store relevant fields)
        metadata = {
            "brand_id": normalized_id,
            "original_brand_id": brand_id,
            "brand_name": brand_data.get("brand_name", ""),
            "tagline": brand_data.get("tagline", ""),
            "brand_values": brand_data.get("brand_values", []),
            "target_audience": brand_data.get("target_audience", []),
            "tone_of_voice": brand_data.get("tone_of_voice", []),
            "colors": brand_data.get("colors", []),
            "accent_color": brand_data.get("accent_color", ""),
            "fonts": brand_data.get("fonts", []),
            "main_font": brand_data.get("main_font", ""),
            "business_overview": brand_data.get("business_overview", ""),
            "logo": brand_data.get("logo", {}),
            "images": brand_data.get("images", []),
            "saved_at": None  # Will be set to current timestamp
        }
        
        # Add timestamp
        from datetime import datetime
        metadata["saved_at"] = datetime.now().isoformat()
        
        # Save to JSON file
        metadata_path = os.path.join(brand_dir, "brand_metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"[LORA] Saved brand metadata for {normalized_id} to {metadata_path}")
        return True
        
    except Exception as e:
        logger.error(f"[LORA] Error saving brand metadata: {str(e)}")
        return False


def load_brand_metadata(brand_id: str) -> Optional[Dict[str, Any]]:
    """
    Load brand metadata for a given brand_id
    
    Args:
        brand_id: Brand identifier
        
    Returns:
        Brand metadata dictionary if found, None otherwise
    """
    try:
        normalized_id = normalize_brand_id(brand_id)
        metadata_path = os.path.join(LORA_BASE_DIR, normalized_id, "brand_metadata.json")
        
        if not os.path.exists(metadata_path):
            logger.debug(f"[LORA] No metadata found for brand_id: {normalized_id}")
            return None
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        logger.info(f"[LORA] Loaded brand metadata for {normalized_id}")
        return metadata
        
    except Exception as e:
        logger.error(f"[LORA] Error loading brand metadata: {str(e)}")
        return None


def get_brand_id_from_data(brand_data: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Extract brand_id from brand data (prefer id, fallback to normalized brand_name)
    
    Args:
        brand_data: Brand data dictionary (can be None)
        
    Returns:
        Brand ID string or None
    """
    if not brand_data or not isinstance(brand_data, dict):
        return None
    
    # Prefer Firestore document ID
    if brand_data.get("id"):
        return brand_data["id"]
    
    # Fallback to normalized brand_name
    if brand_data.get("brand_name"):
        return normalize_brand_id(brand_data["brand_name"])
    
    return None


def preload_lora(pipe: StableDiffusionPipeline, brand_id: str, lora_weight: float = 0.8) -> bool:
    """
    Phase 2: Preload a LoRA into cache at startup
    
    Args:
        pipe: The Stable Diffusion pipeline
        brand_id: Brand identifier to preload
        lora_weight: Weight/strength of LoRA (0.0-1.0), default 0.8
        
    Returns:
        True if preloaded successfully, False otherwise
    """
    try:
        normalized_id = normalize_brand_id(brand_id)
        lora_path = get_lora_path(normalized_id)
        
        if not lora_path:
            logger.warning(f"[LORA-PRELOAD] LoRA not found for {brand_id}, skipping preload")
            return False
        
        logger.info(f"[LORA-PRELOAD] Preloading LoRA for brand: {brand_id}")
        
        # Load the LoRA
        if os.path.isdir(lora_path):
            pipe.load_lora_weights(lora_path, weight=lora_weight)
        else:
            lora_dir = os.path.dirname(lora_path)
            weight_name = os.path.basename(lora_path)
            pipe.load_lora_weights(lora_dir, weight_name=weight_name, weight=lora_weight)
        
        # Add to cache
        _add_to_cache(brand_id, lora_weight, pipe)
        
        logger.info(f"[LORA-PRELOAD] Successfully preloaded LoRA for {brand_id}")
        return True
        
    except Exception as e:
        logger.error(f"[LORA-PRELOAD] Error preloading LoRA for {brand_id}: {str(e)}")
        return False


def preload_loras(pipe: StableDiffusionPipeline, brand_ids: list, lora_weight: float = 0.8) -> Dict[str, bool]:
    """
    Phase 2: Preload multiple LoRAs at startup
    
    Args:
        pipe: The Stable Diffusion pipeline
        brand_ids: List of brand identifiers to preload
        lora_weight: Weight/strength of LoRA (0.0-1.0), default 0.8
        
    Returns:
        Dictionary mapping brand_id to success status
    """
    results = {}
    for brand_id in brand_ids:
        if brand_id and brand_id.strip():
            results[brand_id] = preload_lora(pipe, brand_id.strip(), lora_weight)
    return results


def load_multiple_lora_weights(pipe: StableDiffusionPipeline, lora_configs: List[Dict[str, Any]]) -> StableDiffusionPipeline:
    """
    Phase 3: Load multiple LoRA weights into the pipeline
    
    This function composes multiple LoRAs together. Each LoRA is loaded sequentially
    and their effects are combined.
    
    Args:
        pipe: The Stable Diffusion pipeline
        lora_configs: List of LoRA configurations, each with 'brand_id' and 'weight'
                      Example: [{"brand_id": "apple_style", "weight": 0.7}, ...]
        
    Returns:
        Pipeline with all LoRAs loaded and composed
    """
    if not lora_configs or len(lora_configs) == 0:
        logger.info("[LORA] No LoRA configs provided, using base model")
        return pipe
    
    logger.info(f"[LORA] Loading {len(lora_configs)} LoRAs for composition...")
    
    loaded_count = 0
    for i, config in enumerate(lora_configs):
        brand_id = config.get("brand_id") or config.get("brandId")  # Support both formats
        weight = config.get("weight", 0.8)
        lora_type = config.get("type", "unknown")
        
        if not brand_id:
            logger.warning(f"[LORA] LoRA config {i+1} missing brand_id, skipping")
            continue
        
        logger.info(f"[LORA] [{i+1}/{len(lora_configs)}] Loading LoRA: {brand_id} (type: {lora_type}, weight: {weight})")
        
        try:
            pipe = load_lora_weights(pipe, brand_id, weight)
            loaded_count += 1
        except Exception as e:
            logger.warning(f"[LORA] Failed to load LoRA {brand_id}: {str(e)}, continuing with others...")
    
    logger.info(f"[LORA] Successfully loaded {loaded_count}/{len(lora_configs)} LoRAs for composition")
    return pipe


def get_lora_metadata(brand_id: str) -> Optional[Dict[str, Any]]:
    """
    Phase 3: Get LoRA metadata including version information
    
    Args:
        brand_id: Brand identifier
        
    Returns:
        LoRA metadata dictionary if found, None otherwise
    """
    try:
        normalized_id = normalize_brand_id(brand_id)
        metadata_path = os.path.join(LORA_BASE_DIR, normalized_id, "lora_metadata.json")
        
        if not os.path.exists(metadata_path):
            # Fallback to brand_metadata.json
            metadata_path = os.path.join(LORA_BASE_DIR, normalized_id, "brand_metadata.json")
            if not os.path.exists(metadata_path):
                return None
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        return metadata
        
    except Exception as e:
        logger.error(f"[LORA] Error loading LoRA metadata for {brand_id}: {str(e)}")
        return None


def save_lora_metadata(brand_id: str, metadata: Dict[str, Any]) -> bool:
    """
    Phase 3: Save LoRA metadata including version information
    
    Args:
        brand_id: Brand identifier
        metadata: Metadata dictionary containing:
                  - version: LoRA version string
                  - training_info: Training details (dataset, epochs, etc.)
                  - created_at: Creation timestamp
                  - description: Description of the LoRA
                  - etc.
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        normalized_id = normalize_brand_id(brand_id)
        brand_dir = os.path.join(LORA_BASE_DIR, normalized_id)
        os.makedirs(brand_dir, exist_ok=True)
        
        # Add/update metadata fields
        from datetime import datetime
        metadata["brand_id"] = normalized_id
        metadata["updated_at"] = datetime.now().isoformat()
        
        if "created_at" not in metadata:
            metadata["created_at"] = metadata["updated_at"]
        
        # Save to lora_metadata.json (separate from brand_metadata.json)
        metadata_path = os.path.join(brand_dir, "lora_metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"[LORA] Saved LoRA metadata for {normalized_id} to {metadata_path}")
        return True
        
    except Exception as e:
        logger.error(f"[LORA] Error saving LoRA metadata: {str(e)}")
        return False


def list_available_loras() -> List[Dict[str, Any]]:
    """
    Phase 3: List all available LoRAs with their metadata
    
    Returns:
        List of dictionaries containing LoRA information
    """
    loras = []
    
    if not os.path.exists(LORA_BASE_DIR):
        return loras
    
    try:
        for item in os.listdir(LORA_BASE_DIR):
            brand_dir = os.path.join(LORA_BASE_DIR, item)
            if not os.path.isdir(brand_dir):
                continue
            
            # Check if LoRA file exists
            lora_path = get_lora_path(item)
            if not lora_path:
                continue
            
            # Get metadata
            metadata = get_lora_metadata(item)
            brand_metadata = load_brand_metadata(item)
            
            lora_info = {
                "brand_id": item,
                "normalized_id": normalize_brand_id(item),
                "lora_file": os.path.basename(lora_path) if lora_path else None,
                "lora_metadata": metadata,
                "brand_metadata": brand_metadata,
                "has_lora_file": lora_path is not None
            }
            
            loras.append(lora_info)
            
    except Exception as e:
        logger.error(f"[LORA] Error listing LoRAs: {str(e)}")
    
    return loras

