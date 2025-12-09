# src/infrastructure/apis/vizard_api.py

import logging
import httpx
from typing import Dict, Any, List, Optional
from enum import IntEnum
import time as import_time

from src.config import VIZARD_API_KEY, VIZARD_API_BASE_URL

logger = logging.getLogger(__name__)


class VideoType(IntEnum):
    """Video source types supported by Vizard"""
    REMOTE_FILE = 1
    YOUTUBE = 2
    GOOGLE_DRIVE = 3
    VIMEO = 4
    STREAMYARD = 5
    TIKTOK = 6
    TWITTER = 7
    RUMBLE = 8
    TWITCH = 9
    LOOM = 10
    FACEBOOK = 11
    LINKEDIN = 12


class ClipRatio(IntEnum):
    """Output video aspect ratios"""
    VERTICAL = 1      # 9:16
    SQUARE = 2        # 1:1
    PORTRAIT = 3      # 4:5
    HORIZONTAL = 4    # 16:9


class PreferLength(IntEnum):
    """Preferred clip length options"""
    AUTO = 0                    # Automatically chosen
    LESS_THAN_30 = 1           # Less than 30 seconds
    THIRTY_TO_SIXTY = 2        # 30 to 60 seconds
    SIXTY_TO_NINETY = 3        # 60 to 90 seconds
    NINETY_TO_THREE_MIN = 4    # 90 seconds to 3 minutes


class VizardAPIError(Exception):
    """Custom exception for Vizard API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class VizardAPI:
    """
    Vizard AI API wrapper for video clipping and processing.
    Handles video submission, clip generation, and project management.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Vizard API client.
        
        Args:
            api_key: Vizard API key (defaults to config value if not provided)
        """
        self.api_key = api_key or VIZARD_API_KEY
        self.base_url = VIZARD_API_BASE_URL
        
        if not self.api_key:
            raise ValueError("Vizard API key is required. Set VIZARD_API_KEY in environment or pass it to constructor.")
        
        logger.info("VizardAPI initialized")

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with API key"""
        return {
            "content-type": "application/json",
            "VIZARDAI_API_KEY": self.api_key
        }

    async def create_project(
        self,
        video_url: str,
        video_type: int,
        lang: str,
        prefer_length: List[int],
        ratio_of_clip: int = ClipRatio.VERTICAL,
        ext: Optional[str] = None,
        project_name: Optional[str] = None,
        template_id: Optional[int] = None,
        remove_silence_switch: int = 0,
        max_clip_number: Optional[int] = None,
        keywords: Optional[str] = None,
        subtitle_switch: int = 1,
        headline_switch: int = 1,
        emoji_switch: int = 0,
        highlight_switch: int = 0,
        auto_broll_switch: int = 0
    ) -> Dict[str, Any]:
        """
        Submit a video for clipping and create a new Vizard project.
        
        Args:
            video_url: URL of the video source
            video_type: Source type (use VideoType enum or int 1-12)
            lang: Spoken language code (e.g., 'en', 'es', 'fr')
            prefer_length: List of preferred clip lengths (use PreferLength enum values)
            ratio_of_clip: Output aspect ratio (default: 9:16 vertical)
            ext: Video file extension (required only for videoType=1, e.g., 'mp4', 'avi')
            project_name: Custom name for the project
            template_id: Custom template ID to apply
            remove_silence_switch: Remove silent gaps and filler words (0=off, 1=on)
            max_clip_number: Maximum number of clips to return (1-100)
            keywords: Topics to include in clips
            subtitle_switch: Show subtitles (0=off, 1=on)
            headline_switch: Add AI-generated headline (0=off, 1=on)
            emoji_switch: Enable auto emoji in subtitles (0=off, 1=on)
            highlight_switch: Enable auto highlight keywords (0=off, 1=on)
            auto_broll_switch: Enable auto B-roll (0=off, 1=on)
            
        Returns:
            Dict containing project creation response with project ID and status
            
        Raises:
            VizardAPIError: If the API request fails
            ValueError: If required parameters are missing or invalid
        """
        logger.info(f"Creating Vizard project for video: {video_url}")
        
        # Validate required parameters
        if video_type == VideoType.REMOTE_FILE and not ext:
            raise ValueError("ext parameter is required when videoType is REMOTE_FILE (1)")
        
        # Build request payload
        payload = {
            "videoUrl": video_url,
            "videoType": video_type,
            "lang": lang,
            "preferLength": prefer_length,
            "ratioOfClip": ratio_of_clip,
            "removeSilenceSwitch": remove_silence_switch,
            "subtitleSwitch": subtitle_switch,
            "headlineSwitch": headline_switch,
            "emojiSwitch": emoji_switch,
            "highlightSwitch": highlight_switch,
            "autoBrollSwitch": auto_broll_switch
        }
        
        # Add optional parameters
        if ext:
            payload["ext"] = ext
        if project_name:
            import re
            # Aggressively sanitize project name to avoid "syntax error" from Vizard API
            # Keep only alphanumeric, spaces, hyphens and underscores
            safe_name = re.sub(r'[^a-zA-Z0-9\s\-_]', '', project_name)
            # Limit length just in case
            safe_name = safe_name[:100].strip()
            
            # Fallback if empty
            if not safe_name:
                safe_name = f"Project {int(import_time.time())}"
                
            payload["projectName"] = safe_name
        if template_id:
            payload["templateId"] = template_id
        if max_clip_number is not None:
            if not 1 <= max_clip_number <= 100:
                raise ValueError("max_clip_number must be between 1 and 100")
            payload["maxClipNumber"] = max_clip_number
        if keywords:
            payload["keywords"] = keywords
        
        # Make API request
        url = f"{self.base_url}/project/create"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers()
                )
                
                response_data = response.json()
                
                if response_data is None:
                    raise VizardAPIError("API returned empty response", status_code=response.status_code)

                if response.status_code != 200:
                    logger.error(f"Vizard API error: {response.status_code} - {response_data}")
                    raise VizardAPIError(
                        message=f"Failed to create project: {response_data.get('message', 'Unknown error')}",
                        status_code=response.status_code,
                        response_data=response_data
                    )
                
                project_id = (response_data.get('data') or {}).get('projectId')
                logger.info(f"Project created successfully. Project ID: {project_id}")
                return response_data
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {e}")
            raise VizardAPIError(f"HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise VizardAPIError(f"Unexpected error: {str(e)}")

    async def create_project_from_youtube(
        self,
        youtube_url: str,
        lang: str = "en",
        prefer_length: Optional[List[int]] = None,
        ratio_of_clip: int = ClipRatio.VERTICAL,
        project_name: Optional[str] = None,
        max_clip_number: Optional[int] = None,
        keywords: Optional[str] = None,
        remove_silence: bool = False,
        subtitle_enabled: bool = True,
        headline_enabled: bool = True,
        emoji_enabled: bool = False,
        highlight_enabled: bool = False,
        auto_broll_enabled: bool = False
    ) -> Dict[str, Any]:
        """
        Convenience method to create a project from a YouTube video.
        
        Args:
            youtube_url: YouTube video URL
            lang: Spoken language code (default: 'en')
            prefer_length: List of preferred clip lengths (default: [AUTO])
            ratio_of_clip: Output aspect ratio (default: 9:16 vertical)
            project_name: Custom project name
            max_clip_number: Maximum clips to generate
            keywords: Topics to focus on
            remove_silence: Remove silent gaps and filler words
            subtitle_enabled: Show subtitles
            headline_enabled: Add AI-generated headlines
            emoji_enabled: Add auto emojis
            highlight_enabled: Highlight keywords
            auto_broll_enabled: Add auto B-roll
            
        Returns:
            Dict containing project creation response
        """
        if prefer_length is None:
            prefer_length = [PreferLength.AUTO]
        
        return await self.create_project(
            video_url=youtube_url,
            video_type=VideoType.YOUTUBE,
            lang=lang,
            prefer_length=prefer_length,
            ratio_of_clip=ratio_of_clip,
            project_name=project_name,
            max_clip_number=max_clip_number,
            keywords=keywords,
            remove_silence_switch=1 if remove_silence else 0,
            subtitle_switch=1 if subtitle_enabled else 0,
            headline_switch=1 if headline_enabled else 0,
            emoji_switch=1 if emoji_enabled else 0,
            highlight_switch=1 if highlight_enabled else 0,
            auto_broll_switch=1 if auto_broll_enabled else 0
        )

    async def create_youtube_shorts(
        self,
        video_url: str,
        video_type: int = VideoType.YOUTUBE,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create YouTube Shorts (vertical 9:16, 30-60 seconds) from ANY video source.
        
        Args:
            video_url: Video URL from any supported platform
            video_type: Source type (YouTube, TikTok, Vimeo, etc.) - default: YouTube
            lang: Spoken language code (default: 'en')
            max_clips: Maximum number of shorts to generate (default: 5)
            keywords: Topics to focus on
            project_name: Custom project name
            ext: File extension (required only for REMOTE_FILE type)
            
        Returns:
            Dict containing project creation response
        """
        return await self.create_project(
            video_url=video_url,
            video_type=video_type,
            lang=lang,
            prefer_length=[PreferLength.THIRTY_TO_SIXTY],
            ratio_of_clip=ClipRatio.VERTICAL,
            ext=ext,
            project_name=project_name or "YouTube Shorts Project",
            max_clip_number=max_clips,
            keywords=keywords,
            remove_silence_switch=1,
            subtitle_switch=1,
            headline_switch=1,
            emoji_switch=1
        )

    async def create_tiktok_clips(
        self,
        video_url: str,
        video_type: int = VideoType.YOUTUBE,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create TikTok-style clips (vertical 9:16, <30 seconds) from ANY video source.
        
        Args:
            video_url: Video URL from any supported platform
            video_type: Source type (YouTube, TikTok, Vimeo, etc.) - default: YouTube
            lang: Spoken language code (default: 'en')
            max_clips: Maximum number of clips to generate (default: 5)
            keywords: Topics to focus on
            project_name: Custom project name
            ext: File extension (required only for REMOTE_FILE type)
            
        Returns:
            Dict containing project creation response
        """
        return await self.create_project(
            video_url=video_url,
            video_type=video_type,
            lang=lang,
            prefer_length=[PreferLength.LESS_THAN_30],
            ratio_of_clip=ClipRatio.VERTICAL,
            ext=ext,
            project_name=project_name or "TikTok Clips Project",
            max_clip_number=max_clips,
            keywords=keywords,
            remove_silence_switch=1,
            subtitle_switch=1,
            headline_switch=1,
            emoji_switch=1,
            highlight_switch=1
        )

    async def create_instagram_reels(
        self,
        video_url: str,
        video_type: int = VideoType.YOUTUBE,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create Instagram Reels (vertical 9:16, 30-90 seconds) from ANY video source.
        
        Args:
            video_url: Video URL from any supported platform
            video_type: Source type (YouTube, TikTok, Vimeo, etc.) - default: YouTube
            lang: Spoken language code (default: 'en')
            max_clips: Maximum number of reels to generate (default: 5)
            keywords: Topics to focus on
            project_name: Custom project name
            ext: File extension (required only for REMOTE_FILE type)
            
        Returns:
            Dict containing project creation response
        """
        return await self.create_project(
            video_url=video_url,
            video_type=video_type,
            lang=lang,
            prefer_length=[PreferLength.THIRTY_TO_SIXTY, PreferLength.SIXTY_TO_NINETY],
            ratio_of_clip=ClipRatio.VERTICAL,
            ext=ext,
            project_name=project_name or "Instagram Reels Project",
            max_clip_number=max_clips,
            keywords=keywords,
            remove_silence_switch=1,
            subtitle_switch=1,
            headline_switch=1,
            emoji_switch=1
        )

    async def create_facebook_reels(
        self,
        video_url: str,
        video_type: int = VideoType.YOUTUBE,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create Facebook Reels (vertical 9:16, 30-90 seconds) from ANY video source.
        
        Args:
            video_url: Video URL from any supported platform
            video_type: Source type (YouTube, TikTok, Vimeo, etc.) - default: YouTube
            lang: Spoken language code (default: 'en')
            max_clips: Maximum number of reels to generate (default: 5)
            keywords: Topics to focus on
            project_name: Custom project name
            ext: File extension (required only for REMOTE_FILE type)
            
        Returns:
            Dict containing project creation response
        """
        return await self.create_project(
            video_url=video_url,
            video_type=video_type,
            lang=lang,
            prefer_length=[PreferLength.THIRTY_TO_SIXTY, PreferLength.SIXTY_TO_NINETY],
            ratio_of_clip=ClipRatio.VERTICAL,
            ext=ext,
            project_name=project_name or "Facebook Reels Project",
            max_clip_number=max_clips,
            keywords=keywords,
            remove_silence_switch=1,
            subtitle_switch=1,
            headline_switch=1,
            emoji_switch=1
        )

    async def create_linkedin_clips(
        self,
        video_url: str,
        video_type: int = VideoType.YOUTUBE,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create LinkedIn clips (square 1:1 or vertical 9:16, 30-90 seconds) from ANY video source.
        
        Args:
            video_url: Video URL from any supported platform
            video_type: Source type (YouTube, TikTok, Vimeo, etc.) - default: YouTube
            lang: Spoken language code (default: 'en')
            max_clips: Maximum number of clips to generate (default: 5)
            keywords: Topics to focus on
            project_name: Custom project name
            ext: File extension (required only for REMOTE_FILE type)
            
        Returns:
            Dict containing project creation response
        """
        return await self.create_project(
            video_url=video_url,
            video_type=video_type,
            lang=lang,
            prefer_length=[PreferLength.THIRTY_TO_SIXTY, PreferLength.SIXTY_TO_NINETY],
            ratio_of_clip=ClipRatio.SQUARE,  # LinkedIn prefers square
            ext=ext,
            project_name=project_name or "LinkedIn Clips Project",
            max_clip_number=max_clips,
            keywords=keywords,
            remove_silence_switch=1,
            subtitle_switch=1,
            headline_switch=1,
            emoji_switch=0  # Professional content, no emojis
        )

    async def create_twitter_clips(
        self,
        video_url: str,
        video_type: int = VideoType.YOUTUBE,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create Twitter/X clips (square 1:1, 30-60 seconds) from ANY video source.
        
        Args:
            video_url: Video URL from any supported platform
            video_type: Source type (YouTube, TikTok, Vimeo, etc.) - default: YouTube
            lang: Spoken language code (default: 'en')
            max_clips: Maximum number of clips to generate (default: 5)
            keywords: Topics to focus on
            project_name: Custom project name
            ext: File extension (required only for REMOTE_FILE type)
            
        Returns:
            Dict containing project creation response
        """
        return await self.create_project(
            video_url=video_url,
            video_type=video_type,
            lang=lang,
            prefer_length=[PreferLength.THIRTY_TO_SIXTY],
            ratio_of_clip=ClipRatio.SQUARE,
            ext=ext,
            project_name=project_name or "Twitter Clips Project",
            max_clip_number=max_clips,
            keywords=keywords,
            remove_silence_switch=1,
            subtitle_switch=1,
            headline_switch=1,
            emoji_switch=1
        )

    # Legacy methods for backward compatibility (YouTube-only)
    async def create_shorts_from_youtube(
        self,
        youtube_url: str,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        [DEPRECATED] Use create_youtube_shorts() instead.
        Quick method to create YouTube Shorts from YouTube videos only.
        """
        return await self.create_youtube_shorts(
            video_url=youtube_url,
            video_type=VideoType.YOUTUBE,
            lang=lang,
            max_clips=max_clips,
            keywords=keywords,
            project_name=project_name
        )

    async def create_tiktok_clips_from_youtube(
        self,
        youtube_url: str,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        [DEPRECATED] Use create_tiktok_clips() instead.
        Quick method to create TikTok clips from YouTube videos only.
        """
        return await self.create_tiktok_clips(
            video_url=youtube_url,
            video_type=VideoType.YOUTUBE,
            lang=lang,
            max_clips=max_clips,
            keywords=keywords,
            project_name=project_name
        )

    async def create_instagram_reels_from_youtube(
        self,
        youtube_url: str,
        lang: str = "en",
        max_clips: int = 5,
        keywords: Optional[str] = None,
        project_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        [DEPRECATED] Use create_instagram_reels() instead.
        Quick method to create Instagram Reels from YouTube videos only.
        """
        return await self.create_instagram_reels(
            video_url=youtube_url,
            video_type=VideoType.YOUTUBE,
            lang=lang,
            max_clips=max_clips,
            keywords=keywords,
            project_name=project_name
        )
    async def get_project(self, project_id: str) -> Dict[str, Any]:
        """
        Get project details and status.
        
        Args:
            project_id: The ID of the project to retrieve
            
        Returns:
            Dict containing project details including status and generated clips
        """
        url = f"{self.base_url}/project/query/{project_id}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    headers=self._get_headers()
                )
                
                response_data = response.json()
                
                if response.status_code != 200:
                    logger.error(f"Vizard API error: {response.status_code} - {response_data}")
                    raise VizardAPIError(
                        message=f"Failed to get project: {response_data.get('message', 'Unknown error')}",
                        status_code=response.status_code,
                        response_data=response_data
                    )
                
                return response_data
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {e}")
            raise VizardAPIError(f"HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise VizardAPIError(f"Unexpected error: {str(e)}")
