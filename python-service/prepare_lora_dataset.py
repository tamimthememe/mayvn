"""
LoRA Dataset Preparation Script

Converts brand scraper output (brand_dna.json) into a LoRA training dataset.
Downloads images and generates captions for each image.

Usage:
    python prepare_lora_dataset.py --brand-dna brand_dna.json --output-dir dataset/apple_style
"""

import json
import os
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Optional
from PIL import Image
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_image(url: str, output_path: Path, timeout: int = 10) -> bool:
    """
    Download an image from URL and save it locally.
    
    Args:
        url: Image URL
        output_path: Path to save the image
        timeout: Request timeout in seconds
        
    Returns:
        True if successful, False otherwise
    """
    try:
        response = requests.get(url, timeout=timeout, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        response.raise_for_status()
        
        # Verify it's an image
        img = Image.open(io.BytesIO(response.content))
        img_format = img.format.lower()
        
        # Convert to RGB if needed (for JPEG compatibility)
        if img_format in ['png', 'jpeg', 'jpg']:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Save with appropriate extension
            if img_format == 'png':
                output_path = output_path.with_suffix('.png')
            else:
                output_path = output_path.with_suffix('.jpg')
            
            img.save(output_path, quality=95)
            logger.info(f"Downloaded: {output_path.name} ({img.size[0]}x{img.size[1]})")
            return True
        else:
            logger.warning(f"Skipping non-image format: {url} (format: {img_format})")
            return False
            
    except Exception as e:
        logger.error(f"Failed to download {url}: {str(e)}")
        return False


def generate_image_caption(
    image_path: Path,
    brand_data: Dict,
    image_type: str = "gallery"
) -> str:
    """
    Generate a caption for an image based on brand data.
    
    Args:
        image_path: Path to the image file
        brand_data: Brand DNA data from scraper
        image_type: Type of image ("logo", "gallery", "product")
        
    Returns:
        Caption string for the image
    """
    brand_name = brand_data.get("brand_name", "")
    colors = brand_data.get("colors", [])
    accent_color = brand_data.get("accent_color", "")
    tone_of_voice = brand_data.get("tone_of_voice", [])
    fonts = brand_data.get("fonts", [])
    main_font = brand_data.get("main_font", "")
    
    # Build caption based on image type
    caption_parts = []
    
    if image_type == "logo":
        caption_parts.append(f"{brand_name} logo")
        if accent_color:
            caption_parts.append(f"accent color {accent_color}")
    elif image_type == "gallery":
        # For gallery images, create a brand style caption
        caption_parts.append(f"{brand_name} marketing style")
        caption_parts.append("professional photography")
        
        # Add visual style elements
        if tone_of_voice:
            tone_str = ", ".join(tone_of_voice[:3])  # Top 3 tones
            caption_parts.append(f"{tone_str} aesthetic")
        
        if colors:
            # Include top 2-3 colors
            top_colors = colors[:3]
            if top_colors:
                colors_str = ", ".join(top_colors)
                caption_parts.append(f"color palette {colors_str}")
        
        if accent_color:
            caption_parts.append(f"accent color {accent_color}")
        
        caption_parts.append("minimal design")
        caption_parts.append("clean composition")
        caption_parts.append("premium look")
    else:
        # Generic product/marketing image
        caption_parts.append(f"{brand_name} product")
        caption_parts.append("professional product photography")
        if accent_color:
            caption_parts.append(f"brand color {accent_color}")
    
    # Add brand-specific elements
    if main_font:
        caption_parts.append(f"typography {main_font}")
    
    caption = ", ".join(caption_parts)
    
    # Ensure caption is descriptive but not too long (max 200 chars)
    if len(caption) > 200:
        caption = ", ".join(caption_parts[:8])  # Limit to first 8 parts
    
    return caption


def prepare_dataset_from_scraper(
    brand_dna_path: Path,
    output_dir: Path,
    max_images: int = 50,
    include_logos: bool = False
) -> Dict[str, int]:
    """
    Prepare LoRA training dataset from brand scraper output.
    
    Args:
        brand_dna_path: Path to brand_dna.json file
        output_dir: Directory to save dataset (images + captions)
        max_images: Maximum number of images to download
        include_logos: Whether to include logo images
        
    Returns:
        Dictionary with statistics: {"downloaded": X, "failed": Y, "captions": Z}
    """
    # Load brand DNA data
    with open(brand_dna_path, 'r', encoding='utf-8') as f:
        brand_data = json.load(f)
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    stats = {
        "downloaded": 0,
        "failed": 0,
        "captions": 0
    }
    
    # Collect all image URLs
    image_urls = []
    
    # Add gallery images (these are best for brand style training)
    gallery_images = brand_data.get("images", [])
    for img_url in gallery_images[:max_images]:
        image_urls.append(("gallery", img_url))
    
    # Optionally add logo images
    if include_logos:
        logo_obj = brand_data.get("logo", {})
        for logo_type, logo_url in logo_obj.items():
            if logo_url:
                image_urls.append(("logo", logo_url))
    
    logger.info(f"Found {len(image_urls)} images to download")
    
    # Download images and generate captions
    for idx, (image_type, img_url) in enumerate(image_urls, 1):
        if stats["downloaded"] >= max_images:
            break
        
        # Generate filename
        filename_base = f"{idx:04d}_{image_type}"
        image_path = output_dir / filename_base
        
        # Download image
        if download_image(img_url, image_path):
            stats["downloaded"] += 1
            
            # Generate caption
            caption = generate_image_caption(image_path, brand_data, image_type)
            
            # Save caption file
            caption_path = image_path.with_suffix('.txt')
            with open(caption_path, 'w', encoding='utf-8') as f:
                f.write(caption)
            
            stats["captions"] += 1
            logger.info(f"Caption: {caption[:80]}...")
        else:
            stats["failed"] += 1
    
    # Create dataset info file
    dataset_info = {
        "brand_name": brand_data.get("brand_name", ""),
        "total_images": stats["downloaded"],
        "source": "brand_scraper",
        "prepared_at": str(Path.cwd()),
        "brand_data": {
            "colors": brand_data.get("colors", []),
            "accent_color": brand_data.get("accent_color", ""),
            "fonts": brand_data.get("fonts", []),
            "tone_of_voice": brand_data.get("tone_of_voice", [])
        }
    }
    
    info_path = output_dir / "dataset_info.json"
    with open(info_path, 'w', encoding='utf-8') as f:
        json.dump(dataset_info, f, indent=2, ensure_ascii=False)
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Dataset preparation complete!")
    logger.info(f"  Downloaded: {stats['downloaded']} images")
    logger.info(f"  Failed: {stats['failed']} images")
    logger.info(f"  Captions: {stats['captions']} captions")
    logger.info(f"  Output directory: {output_dir}")
    logger.info(f"{'='*60}")
    
    return stats


def enhance_dataset_with_more_images(
    brand_data: Dict,
    output_dir: Path,
    additional_urls: List[str]
) -> int:
    """
    Add more images to the dataset from additional URLs.
    Useful if scraper only found a few images.
    
    Args:
        brand_data: Brand DNA data
        output_dir: Dataset directory
        additional_urls: List of additional image URLs to download
        
    Returns:
        Number of images successfully added
    """
    existing_images = list(output_dir.glob("*.jpg")) + list(output_dir.glob("*.png"))
    start_idx = len(existing_images) + 1
    
    added = 0
    for idx, url in enumerate(additional_urls, start_idx):
        filename_base = f"{idx:04d}_additional"
        image_path = output_dir / filename_base
        
        if download_image(url, image_path):
            # Generate caption
            caption = generate_image_caption(image_path, brand_data, "gallery")
            
            # Save caption
            caption_path = image_path.with_suffix('.txt')
            with open(caption_path, 'w', encoding='utf-8') as f:
                f.write(caption)
            
            added += 1
    
    return added


def main():
    parser = argparse.ArgumentParser(
        description="Prepare LoRA training dataset from brand scraper output"
    )
    parser.add_argument(
        "--brand-dna",
        type=str,
        required=True,
        help="Path to brand_dna.json file from scraper"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        required=True,
        help="Output directory for dataset (images + captions)"
    )
    parser.add_argument(
        "--max-images",
        type=int,
        default=50,
        help="Maximum number of images to download (default: 50)"
    )
    parser.add_argument(
        "--include-logos",
        action="store_true",
        help="Include logo images in dataset"
    )
    
    args = parser.parse_args()
    
    brand_dna_path = Path(args.brand_dna)
    output_dir = Path(args.output_dir)
    
    if not brand_dna_path.exists():
        logger.error(f"Brand DNA file not found: {brand_dna_path}")
        return 1
    
    stats = prepare_dataset_from_scraper(
        brand_dna_path=brand_dna_path,
        output_dir=output_dir,
        max_images=args.max_images,
        include_logos=args.include_logos
    )
    
    if stats["downloaded"] < 20:
        logger.warning(
            f"\n⚠️  WARNING: Only {stats['downloaded']} images downloaded. "
            f"LoRA training typically needs 20-100 images for best results.\n"
            f"Consider:\n"
            f"  1. Scraping more pages (increase MAX_PAGES_TO_CRAWL in scraper)\n"
            f"  2. Adding more image URLs manually\n"
            f"  3. Using the scraper on multiple brand websites\n"
        )
    
    return 0


if __name__ == "__main__":
    exit(main())


