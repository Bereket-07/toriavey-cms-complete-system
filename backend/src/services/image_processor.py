# src/services/image_processor.py

import logging
from typing import Dict, Tuple, Optional
from PIL import Image, ImageOps
import io
import httpx
from pathlib import Path

logger = logging.getLogger(__name__)


class ImageProcessor:
    """
    Service for processing images for social media platforms.
    Handles cropping, resizing, and format conversion.
    """
    
    # Platform-specific aspect ratios (width:height)
    PLATFORM_RATIOS = {
        "instagram": {
            "square": (1, 1),
            "portrait": (4, 5),
            "landscape": (1.91, 1)
        },
        "twitter": {
            "landscape": (16, 9),
            "square": (1, 1)
        },
        "facebook": {
            "landscape": (1.91, 1),
            "square": (1, 1),
            "portrait": (4, 5)
        },
        "pinterest": {
            "vertical": (2, 3)
        }
    }
    
    # Recommended dimensions for each platform
    PLATFORM_DIMENSIONS = {
        "instagram": (1080, 1080),  # Square
        "twitter": (1200, 675),     # 16:9
        "facebook": (1200, 630),    # 1.91:1
        "pinterest": (1000, 1500)   # 2:3
    }
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize image processor.
        
        Args:
            cache_dir: Directory to cache processed images
        """
        self.cache_dir = Path(cache_dir) if cache_dir else None
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def process_for_platform(
        self,
        image_url: str,
        platform: str,
        prefer_ratio: str = "square"
    ) -> Tuple[bytes, str]:
        """
        Process image for a specific platform.
        
        Args:
            image_url: URL of the image to process
            platform: Platform name (instagram, twitter, facebook, pinterest)
            prefer_ratio: Preferred aspect ratio (square, portrait, landscape, vertical)
            
        Returns:
            Tuple of (processed_image_bytes, content_type)
        """
        logger.info(f"Processing image for {platform} with {prefer_ratio} ratio")
        
        try:
            # Download image
            image_data = await self._download_image(image_url)
            
            # Open image
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Get target dimensions
            target_width, target_height = self.PLATFORM_DIMENSIONS.get(
                platform,
                (1080, 1080)  # Default to Instagram square
            )
            
            # Get aspect ratio
            ratio = self.PLATFORM_RATIOS.get(platform, {}).get(prefer_ratio)
            if ratio:
                target_width, target_height = self._calculate_dimensions(ratio, target_width)
            
            # Crop and resize
            processed_img = self._smart_crop_and_resize(
                img,
                target_width,
                target_height
            )
            
            # Convert to bytes
            output = io.BytesIO()
            processed_img.save(output, format='JPEG', quality=90, optimize=True)
            output.seek(0)
            
            logger.info(f"Image processed: {processed_img.size}")
            
            return output.getvalue(), 'image/jpeg'
            
        except Exception as e:
            logger.error(f"Error processing image: {e}", exc_info=True)
            raise
    
    async def _download_image(self, url: str) -> bytes:
        """Download image from URL."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            return response.content
    
    def _calculate_dimensions(
        self,
        ratio: Tuple[float, float],
        base_width: int
    ) -> Tuple[int, int]:
        """Calculate dimensions based on aspect ratio."""
        width_ratio, height_ratio = ratio
        height = int(base_width * (height_ratio / width_ratio))
        return (base_width, height)
    
    def _smart_crop_and_resize(
        self,
        img: Image.Image,
        target_width: int,
        target_height: int
    ) -> Image.Image:
        """
        Smart crop and resize image to target dimensions.
        Uses center crop for now, can be enhanced with face detection.
        """
        # Calculate current aspect ratio
        current_ratio = img.width / img.height
        target_ratio = target_width / target_height
        
        if abs(current_ratio - target_ratio) < 0.01:
            # Aspect ratios are close, just resize
            return img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Need to crop
        if current_ratio > target_ratio:
            # Image is wider than target, crop width
            new_width = int(img.height * target_ratio)
            left = (img.width - new_width) // 2
            img = img.crop((left, 0, left + new_width, img.height))
        else:
            # Image is taller than target, crop height
            new_height = int(img.width / target_ratio)
            top = (img.height - new_height) // 2
            img = img.crop((0, top, img.width, top + new_height))
        
        # Resize to target dimensions
        return img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    def get_platform_ratio(self, platform: str, prefer: str = "square") -> Optional[Tuple[float, float]]:
        """Get aspect ratio for a platform."""
        return self.PLATFORM_RATIOS.get(platform, {}).get(prefer)
