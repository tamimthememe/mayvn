"""
LoRA Deployment Script

Automates the deployment of trained LoRA files to the service.

Usage:
    python deploy_lora.py --lora-file output/apple_brand_style.safetensors --brand-id apple
    python deploy_lora.py --lora-file output/apple_brand_style.safetensors --brand-id apple --metadata brand_dna.json
"""

import argparse
import os
import shutil
import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Default LoRA directory (matches lora_manager.py)
LORA_BASE_DIR = os.getenv("LORA_BASE_DIR", "loras")


def normalize_brand_id(brand_id: str) -> str:
    """
    Normalize brand_id to filesystem-safe string.
    Matches the logic in lora_manager.py
    """
    import re
    # Convert to lowercase
    normalized = brand_id.lower()
    # Replace spaces and special chars with underscores
    normalized = re.sub(r'[^\w\-_]', '_', normalized)
    # Collapse multiple underscores
    normalized = re.sub(r'_+', '_', normalized)
    # Remove leading/trailing underscores
    normalized = normalized.strip('_')
    return normalized


def deploy_lora(
    lora_file: Path,
    brand_id: str,
    metadata_file: Path = None,
    target_name: str = "style.safetensors"
) -> bool:
    """
    Deploy a LoRA file to the service.
    
    Args:
        lora_file: Path to the trained LoRA file
        brand_id: Brand identifier
        metadata_file: Optional path to brand metadata JSON
        target_name: Target filename (default: style.safetensors)
        
    Returns:
        True if successful, False otherwise
    """
    # Validate LoRA file exists
    if not lora_file.exists():
        logger.error(f"❌ LoRA file not found: {lora_file}")
        return False
    
    # Validate file extension
    if not lora_file.suffix.lower() == '.safetensors':
        logger.warning(f"⚠️  Warning: File extension is {lora_file.suffix}, expected .safetensors")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            return False
    
    # Normalize brand_id
    normalized_id = normalize_brand_id(brand_id)
    logger.info(f"📝 Brand ID: {brand_id} → {normalized_id}")
    
    # Create brand directory
    brand_dir = Path(LORA_BASE_DIR) / normalized_id
    brand_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Created directory: {brand_dir}")
    
    # Copy LoRA file
    target_file = brand_dir / target_name
    try:
        shutil.copy2(lora_file, target_file)
        logger.info(f"✅ Copied LoRA file:")
        logger.info(f"   From: {lora_file}")
        logger.info(f"   To:   {target_file}")
        
        # Show file size
        file_size_mb = target_file.stat().st_size / (1024 * 1024)
        logger.info(f"   Size: {file_size_mb:.2f} MB")
    except Exception as e:
        logger.error(f"❌ Failed to copy LoRA file: {e}")
        return False
    
    # Copy metadata if provided
    if metadata_file and metadata_file.exists():
        try:
            # Load and validate JSON
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Save to brand directory
            metadata_target = brand_dir / "brand_metadata.json"
            with open(metadata_target, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Copied brand metadata:")
            logger.info(f"   From: {metadata_file}")
            logger.info(f"   To:   {metadata_target}")
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in metadata file: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to copy metadata: {e}")
            return False
    elif metadata_file:
        logger.warning(f"⚠️  Metadata file not found: {metadata_file}")
    
    # Verify deployment
    logger.info("\n" + "=" * 60)
    logger.info("✅ Deployment Complete!")
    logger.info("=" * 60)
    logger.info(f"Brand ID: {normalized_id}")
    logger.info(f"LoRA File: {target_file}")
    if metadata_file and metadata_file.exists():
        logger.info(f"Metadata: {brand_dir / 'brand_metadata.json'}")
    logger.info("\n📋 Next Steps:")
    logger.info("1. Restart the Python service:")
    logger.info("   python main.py")
    logger.info("\n2. Test your LoRA:")
    logger.info(f'   curl -X POST http://localhost:8000/generate-async \\')
    logger.info(f'     -H "Content-Type: application/json" \\')
    logger.info(f'     -d \'{{"prompt": "test", "brand_id": "{normalized_id}", "lora_weights": 0.8}}\'')
    logger.info("\n3. Or use the test script:")
    logger.info("   python test_lora.py")
    logger.info("=" * 60)
    
    return True


def list_deployed_loras():
    """List all deployed LoRAs"""
    lora_dir = Path(LORA_BASE_DIR)
    
    if not lora_dir.exists():
        logger.info(f"📁 LoRA directory doesn't exist: {lora_dir}")
        return
    
    logger.info(f"\n📋 Deployed LoRAs in {lora_dir}:")
    logger.info("=" * 60)
    
    found_any = False
    for brand_dir in sorted(lora_dir.iterdir()):
        if not brand_dir.is_dir():
            continue
        
        if brand_dir.name == "__pycache__" or brand_dir.name.startswith("."):
            continue
        
        found_any = True
        logger.info(f"\n📁 {brand_dir.name}/")
        
        # Check for LoRA files
        lora_files = list(brand_dir.glob("*.safetensors"))
        if lora_files:
            for lora_file in lora_files:
                size_mb = lora_file.stat().st_size / (1024 * 1024)
                logger.info(f"   ✅ {lora_file.name} ({size_mb:.2f} MB)")
        else:
            logger.info(f"   ⚠️  No LoRA files found")
        
        # Check for metadata
        metadata_file = brand_dir / "brand_metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                brand_name = metadata.get("brand_name", "Unknown")
                logger.info(f"   📄 brand_metadata.json (Brand: {brand_name})")
            except:
                logger.info(f"   📄 brand_metadata.json")
    
    if not found_any:
        logger.info("   (No LoRAs deployed yet)")
    
    logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Deploy trained LoRA files to the image generation service"
    )
    parser.add_argument(
        "--lora-file",
        type=str,
        help="Path to the trained LoRA file (.safetensors)"
    )
    parser.add_argument(
        "--brand-id",
        type=str,
        help="Brand identifier (will be normalized)"
    )
    parser.add_argument(
        "--metadata",
        type=str,
        help="Optional path to brand metadata JSON file"
    )
    parser.add_argument(
        "--target-name",
        type=str,
        default="style.safetensors",
        help="Target filename (default: style.safetensors)"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all deployed LoRAs"
    )
    
    args = parser.parse_args()
    
    # List mode
    if args.list:
        list_deployed_loras()
        return 0
    
    # Deploy mode
    if not args.lora_file or not args.brand_id:
        parser.error("--lora-file and --brand-id are required (or use --list)")
    
    lora_file = Path(args.lora_file)
    metadata_file = Path(args.metadata) if args.metadata else None
    
    success = deploy_lora(
        lora_file=lora_file,
        brand_id=args.brand_id,
        metadata_file=metadata_file,
        target_name=args.target_name
    )
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())

