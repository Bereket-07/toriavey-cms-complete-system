# src/use_cases/manage_clips.py

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.infrastructure.apis.youtube_api import YouTubeAPI
from src.domain.schemas.clip_schemas import TargetPlatform

logger = logging.getLogger(__name__)


class ManageClipsUseCase:
    """
    Use case for managing clips: approving, rejecting, and posting to social media.
    """
    
    def __init__(self, entity_id: str):
        """
        Initialize with entity ID for social media APIs.
        
        Args:
            entity_id: Composio entity ID for the user
        """
        self.entity_id = entity_id
        self.youtube_api = YouTubeAPI(entity_id=entity_id)
    
    async def approve_clip(
        self,
        clip_id: int,
        clip_data: Dict[str, Any],
        approved_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """Approve a clip for posting"""
        logger.info(f"Approving clip {clip_id}")
        
        return {
            "success": True,
            "clip_id": clip_id,
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": approved_by
        }
    
    async def reject_clip(
        self,
        clip_id: int,
        rejection_reason: Optional[str] = None,
        rejected_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """Reject a clip"""
        logger.info(f"Rejecting clip {clip_id}: {rejection_reason}")
        
        return {
            "success": True,
            "clip_id": clip_id,
            "status": "rejected",
            "rejected_at": datetime.utcnow().isoformat(),
            "rejection_reason": rejection_reason,
            "rejected_by": rejected_by
        }
    
    async def post_clip_to_platforms(
        self,
        clip_data: Dict[str, Any],
        platforms: List[TargetPlatform],
        custom_caption: Optional[str] = None,
        custom_hashtags: Optional[str] = None
    ) -> Dict[str, Any]:
        """Post an approved clip to specified social media platforms"""
        logger.info(f"Posting clip {clip_data.get('id')} to {len(platforms)} platforms")
        
        results = {
            "posted_platforms": [],
            "failed_platforms": []
        }
        
        for platform in platforms:
            try:
                result = await self._post_to_platform(
                    platform=platform,
                    clip_data=clip_data,
                    caption=custom_caption,
                    hashtags=custom_hashtags
                )
                
                if result.get("success"):
                    results["posted_platforms"].append(platform.value)
                else:
                    results["failed_platforms"].append({
                        "platform": platform.value,
                        "error": result.get("error", "Unknown error")
                    })
                    
            except Exception as e:
                logger.error(f"Failed to post to {platform.value}: {e}")
                results["failed_platforms"].append({
                    "platform": platform.value,
                    "error": str(e)
                })
        
        return results
    
    async def _post_to_platform(
        self,
        platform: TargetPlatform,
        clip_data: Dict[str, Any],
        caption: Optional[str],
        hashtags: Optional[str]
    ) -> Dict[str, Any]:
        """Post to a specific platform"""
        
        video_file_path = clip_data.get("clip_url")
        title = caption or clip_data.get("title", "Untitled")
        description = clip_data.get("description", "")
        tags = hashtags.split() if hashtags else []
        
        if platform == TargetPlatform.YOUTUBE_SHORTS:
            return await self._post_to_youtube_shorts(
                video_file_path=video_file_path,
                title=title,
                description=description,
                tags=tags
            )
        else:
            return {
                "success": False,
                "error": f"Platform {platform.value} integration pending"
            }
    
    async def _post_to_youtube_shorts(
        self,
        video_file_path: str,
        title: str,
        description: str,
        tags: List[str]
    ) -> Dict[str, Any]:
        """Post to YouTube Shorts"""
        try:
            result = await self.youtube_api.upload_video(
                video_file_path=video_file_path,
                title=title,
                description=description,
                category_id="22",
                privacy_status="public",
                tags=tags
            )
            
            return {
                "success": result.get("successful", False),
                "platform_post_id": result.get("data", {}).get("id"),
                "error": result.get("error")
            }
        except Exception as e:
            logger.error(f"YouTube upload failed: {e}")
            return {"success": False, "error": str(e)}
