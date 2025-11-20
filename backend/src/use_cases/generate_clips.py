# src/use_cases/generate_clips.py

import logging
import json
from typing import List, Dict, Any
from datetime import datetime

from src.infrastructure.apis.vizard_api import VizardAPI, VideoType
from src.domain.schemas.clip_schemas import VideoSourceType, TargetPlatform

logger = logging.getLogger(__name__)


class GenerateClipsUseCase:
    """
    Use case for generating video clips from source videos using Vizard AI.
    Handles the workflow of submitting videos and creating clips for multiple platforms.
    """
    
    def __init__(self):
        self.vizard_api = VizardAPI()
    
    def _map_source_type_to_video_type(self, source_type: VideoSourceType) -> int:
        """Map schema source type to Vizard VideoType enum"""
        mapping = {
            VideoSourceType.YOUTUBE: VideoType.YOUTUBE,
            VideoSourceType.TIKTOK: VideoType.TIKTOK,
            VideoSourceType.VIMEO: VideoType.VIMEO,
            VideoSourceType.FACEBOOK: VideoType.FACEBOOK,
            VideoSourceType.LINKEDIN: VideoType.LINKEDIN,
            VideoSourceType.TWITTER: VideoType.TWITTER,
            VideoSourceType.TWITCH: VideoType.TWITCH,
            VideoSourceType.LOOM: VideoType.LOOM,
            VideoSourceType.GOOGLE_DRIVE: VideoType.GOOGLE_DRIVE,
            VideoSourceType.STREAMYARD: VideoType.STREAMYARD,
            VideoSourceType.RUMBLE: VideoType.RUMBLE,
            VideoSourceType.REMOTE_FILE: VideoType.REMOTE_FILE,
        }
        return mapping.get(source_type, VideoType.YOUTUBE)
    
    async def create_clips_for_platforms(
        self,
        video_url: str,
        source_type: VideoSourceType,
        target_platforms: List[TargetPlatform],
        language: str = "en",
        max_clips_per_platform: int = 5,
        keywords: str = None,
        project_name: str = None,
        file_extension: str = None
    ) -> Dict[str, Any]:
        """
        Generate clips for multiple platforms from a single video source.
        
        Args:
            video_url: URL of the source video
            source_type: Type of video source
            target_platforms: List of platforms to generate clips for
            language: Spoken language in the video
            max_clips_per_platform: Maximum clips per platform
            keywords: Keywords to focus on
            project_name: Custom project name
            file_extension: File extension (required for remote files)
            
        Returns:
            Dictionary with project results for each platform
        """
        logger.info(f"Starting clip generation for {len(target_platforms)} platforms from {video_url}")
        
        video_type = self._map_source_type_to_video_type(source_type)
        results = {}
        
        for platform in target_platforms:
            try:
                result = await self._create_clips_for_platform(
                    video_url=video_url,
                    video_type=video_type,
                    platform=platform,
                    language=language,
                    max_clips=max_clips_per_platform,
                    keywords=keywords,
                    project_name=project_name,
                    file_extension=file_extension
                )
                results[platform.value] = result
                logger.info(f"Successfully created clips for {platform.value}")
            except Exception as e:
                logger.error(f"Failed to create clips for {platform.value}: {e}")
                results[platform.value] = {
                    "success": False,
                    "error": str(e)
                }
        
        return results
    
    async def _create_clips_for_platform(
        self,
        video_url: str,
        video_type: int,
        platform: TargetPlatform,
        language: str,
        max_clips: int,
        keywords: str,
        project_name: str,
        file_extension: str
    ) -> Dict[str, Any]:
        """Create clips for a specific platform"""
        
        # Map target platform to appropriate Vizard API method
        platform_methods = {
            TargetPlatform.YOUTUBE_SHORTS: self.vizard_api.create_youtube_shorts,
            TargetPlatform.TIKTOK: self.vizard_api.create_tiktok_clips,
            TargetPlatform.INSTAGRAM_REELS: self.vizard_api.create_instagram_reels,
            TargetPlatform.FACEBOOK_REELS: self.vizard_api.create_facebook_reels,
            TargetPlatform.LINKEDIN: self.vizard_api.create_linkedin_clips,
            TargetPlatform.TWITTER: self.vizard_api.create_twitter_clips,
        }
        
        method = platform_methods.get(platform)
        if not method:
            raise ValueError(f"Unsupported platform: {platform}")
        
        # Call the appropriate Vizard API method
        result = await method(
            video_url=video_url,
            video_type=video_type,
            lang=language,
            max_clips=max_clips,
            keywords=keywords,
            project_name=project_name or f"{platform.value.replace('_', ' ').title()} Project",
            ext=file_extension
        )
        
        return result
    
    async def create_all_platform_clips(
        self,
        video_url: str,
        source_type: VideoSourceType,
        language: str = "en",
        max_clips: int = 5,
        keywords: str = None,
        file_extension: str = None
    ) -> Dict[str, Any]:
        """
        Convenience method to create clips for ALL supported platforms.
        
        Args:
            video_url: URL of the source video
            source_type: Type of video source
            language: Spoken language
            max_clips: Max clips per platform
            keywords: Keywords to focus on
            file_extension: File extension for remote files
            
        Returns:
            Results for all platforms
        """
        all_platforms = [
            TargetPlatform.YOUTUBE_SHORTS,
            TargetPlatform.TIKTOK,
            TargetPlatform.INSTAGRAM_REELS,
            TargetPlatform.FACEBOOK_REELS,
            TargetPlatform.LINKEDIN,
            TargetPlatform.TWITTER,
        ]
        
        return await self.create_clips_for_platforms(
            video_url=video_url,
            source_type=source_type,
            target_platforms=all_platforms,
            language=language,
            max_clips_per_platform=max_clips,
            keywords=keywords,
            file_extension=file_extension
        )
