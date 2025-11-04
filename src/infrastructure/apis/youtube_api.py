# src/infrastructure/apis/youtube_api.py

import logging
from typing import Dict, Any, List, Optional
# from composio import Action
from composio import Action          # <-- changed

from src.infrastructure.apis.composio import ComposioExecutorService

logger = logging.getLogger(__name__)


class YouTubeAPI:
    """
    YouTube API wrapper using Composio for social media integration.
    Handles video uploads, listing channel videos, and fetching video details.
    """

    def __init__(self, entity_id: str):
        """
        Initialize YouTube API with Composio executor.
        
        Args:
            entity_id: The Composio entity ID for the user/account
        """
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "YOUTUBE"
        logger.info(f"YouTubeAPI initialized for entity: {entity_id}")

    async def _ensure_authentication(self) -> None:
        """
        Ensure YouTube is authenticated before making API calls.
        Raises ComposioAuthRequired or ComposioApiKeyRequired if not authenticated.
        """
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )

    async def upload_video(
        self,
        video_file_path: str,
        title: str,
        description: str,
        category_id: str,
        privacy_status: str,
        tags: List[str]
    ) -> Dict[str, Any]:
        """
        Upload a video to YouTube channel.
        
        Args:
            video_file_path: Local file path to the video file (must be YouTube-supported format)
            title: Video title
            description: Video description
            category_id: YouTube category ID (e.g., "22" for People & Blogs)
            privacy_status: Privacy status - "public", "private", or "unlisted"
            tags: List of tags for the video
            
        Returns:
            Dict containing:
                - data: Video upload response data
                - successful: Boolean indicating success
                - error: Error message if any
                
        Raises:
            ComposioAuthRequired: If YouTube authentication is needed
            Exception: If upload fails
        """
        logger.info(f"Uploading video: {title} from {video_file_path}")
        
        # Ensure authentication
        await self._ensure_authentication()
        
        # Prepare action parameters
        params = {
            "videoFilePath": video_file_path,
            "title": title,
            "description": description,
            "categoryId": category_id,
            "privacyStatus": privacy_status,
            "tags": tags
        }
        
        # Get the upload action
        action = Action.YOUTUBE_UPLOAD_VIDEO
        
        # Execute the action
        result = await self.composio_executor.execute_action(
            action=action,
            params=params
        )
        
        logger.info(f"Video upload completed. Success: {result.get('successful', False)}")
        return result

    async def list_channel_videos(
        self,
        channel_id: str,
        max_results: int = 5,
        page_token: Optional[str] = None,
        part: str = "snippet"
    ) -> Dict[str, Any]:
        """
        List videos from a specified YouTube channel.
        
        Args:
            channel_id: The YouTube channel ID
            max_results: Maximum number of results to return (default: 5)
            page_token: Token for pagination (optional)
            part: Resource parts to include (default: "snippet")
            
        Returns:
            Dict containing:
                - data: List of videos with their details
                - successful: Boolean indicating success
                - error: Error message if any
                
        Raises:
            ComposioAuthRequired: If YouTube authentication is needed
            Exception: If listing fails
        """
        logger.info(f"Listing videos for channel: {channel_id}, max_results: {max_results}")
        
        # Ensure authentication
        await self._ensure_authentication()
        
        # Prepare action parameters
        params = {
            "channelId": channel_id,
            "maxResults": max_results,
            "part": part
        }
        
        # Add page_token if provided
        if page_token:
            params["pageToken"] = page_token
        
        # Get the list action
        action = Action.YOUTUBE_LIST_CHANNEL_VIDEOS
        
        # Execute the action
        result = await self.composio_executor.execute_action(
            action=action,
            params=params
        )
        
        logger.info(f"Channel videos listed. Success: {result.get('successful', False)}")
        return result

    async def get_video_details_batch(
        self,
        video_ids: List[str],
        parts: List[str],
        hl: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve multiple YouTube video resource parts in a single batch call.
        Use this when you need cohort-level metrics for many videos to reduce quota usage and latency.
        
        Args:
            video_ids: List of YouTube video IDs to fetch details for
            parts: List of resource parts to retrieve (e.g., ["snippet", "statistics", "contentDetails"])
            hl: Language code for localized data (optional, e.g., "en", "es")
            
        Returns:
            Dict containing:
                - data: Batch video details response
                - successful: Boolean indicating success
                - error: Error message if any
                
        Raises:
            ComposioAuthRequired: If YouTube authentication is needed
            Exception: If batch fetch fails
        """
        logger.info(f"Fetching batch video details for {len(video_ids)} videos")
        
        # Ensure authentication
        await self._ensure_authentication()
        
        # Prepare action parameters
        params = {
            "id": video_ids,
            "parts": parts
        }
        
        # Add hl if provided
        if hl:
            params["hl"] = hl
        
        # Get the batch details action
        action = Action.YOUTUBE_GET_VIDEO_DETAILS_BATCH
        
        # Execute the action
        result = await self.composio_executor.execute_action(
            action=action,
            params=params
        )
        
        logger.info(f"Batch video details fetched. Success: {result.get('successful', False)}")
        return result

    async def get_channel_videos_with_details(
        self,
        channel_id: str,
        max_results: int = 5,
        detail_parts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Convenience method to list channel videos and fetch their detailed information.
        
        Args:
            channel_id: The YouTube channel ID
            max_results: Maximum number of videos to fetch (default: 5)
            detail_parts: Parts to fetch for each video (default: ["snippet", "statistics"])
            
        Returns:
            Dict containing:
                - videos: List of videos with full details
                - successful: Boolean indicating success
                - error: Error message if any
        """
        if detail_parts is None:
            detail_parts = ["snippet", "statistics"]
        
        logger.info(f"Fetching channel videos with details for channel: {channel_id}")
        
        # First, list the videos
        list_result = await self.list_channel_videos(
            channel_id=channel_id,
            max_results=max_results
        )
        
        if not list_result.get("successful", False):
            return list_result
        
        # Extract video IDs from the list result
        videos_data = list_result.get("data", {})
        items = videos_data.get("items", [])
        
        if not items:
            return {
                "videos": [],
                "successful": True,
                "error": None
            }
        
        # Extract video IDs
        video_ids = []
        for item in items:
            video_id = item.get("id", {}).get("videoId")
            if video_id:
                video_ids.append(video_id)
        
        if not video_ids:
            return {
                "videos": items,
                "successful": True,
                "error": None
            }
        
        # Fetch detailed information for all videos
        details_result = await self.get_video_details_batch(
            video_ids=video_ids,
            parts=detail_parts
        )
        
        if not details_result.get("successful", False):
            # Return basic info if details fetch fails
            return {
                "videos": items,
                "successful": True,
                "error": f"Details fetch failed: {details_result.get('error')}"
            }
        
        # Combine the results
        detailed_videos = details_result.get("data", {}).get("items", [])
        
        return {
            "videos": detailed_videos,
            "successful": True,
            "error": None
        }
