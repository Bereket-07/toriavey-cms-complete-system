# src/infrastructure/apis/youtube_api.py
import logging
import os
import tempfile
import requests
from typing import Dict, Any, Optional
from composio import Action
from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
from src import config

logger = logging.getLogger(__name__)

class YouTubeAPI:
    """
    YouTube API wrapper using Composio for video uploads.
    Uses YOUTUBE_UPLOAD_VIDEO for posting shorts.
    """

    def __init__(self, entity_id: str):
        """Initialize YouTube API with Composio executor."""
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "YOUTUBE"
        self.max_description_length = 5000  # YouTube description limit
        logger.info(f"YouTubeAPI initialized for entity: {entity_id}")

    async def _ensure_authentication(self) -> None:
        """Ensure YouTube OAuth authentication."""
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )

    def _truncate_text(self, text: str, max_length: int = None) -> str:
        """Truncate text to fit YouTube's description limit."""
        if max_length is None:
            max_length = self.max_description_length
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."

    def _download_video(self, url: str) -> str:
        """Download video from URL to a temporary file."""
        try:
            logger.info(f"Downloading video from {url}...")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Create a temporary file
            # We try to preserve extension if possible, default to .mp4
            ext = ".mp4"
            if "." in url.split("/")[-1]:
                possible_ext = "." + url.split("/")[-1].split(".")[-1].split("?")[0]
                if len(possible_ext) <= 5: # Sanity check
                    ext = possible_ext

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    tmp_file.write(chunk)
                tmp_path = tmp_file.name
            
            logger.info(f"Video downloaded to {tmp_path}")
            return tmp_path
        except Exception as e:
            logger.error(f"Failed to download video: {e}")
            raise

    async def upload_short(
        self,
        video_file_path: str,
        title: str,
        description: str = "",
        tags: list = None,
        privacy_status: str = "public",
        truncate: bool = True
    ) -> Dict[str, Any]:
        """
        Upload a short video to YouTube.
        
        Args:
            video_file_path: Path to the video file OR URL
            title: Video title
            description: Video description
            tags: List of tags for the video
            privacy_status: Privacy setting ('public', 'private', 'unlisted')
            truncate: Whether to auto-truncate description
            
        Returns:
            Dict with successful, video_id, video_url, error
        """
        logger.info(f"Uploading YouTube Short: {title}")
        
        if tags is None:
            tags = []
            
        temp_file_path = None
            
        try:
            # Ensure authentication
            await self._ensure_authentication()
            
            # Handle URL input by downloading to temp file
            if video_file_path.startswith("http://") or video_file_path.startswith("https://"):
                temp_file_path = self._download_video(video_file_path)
                upload_path = temp_file_path
            else:
                upload_path = video_file_path
            
            # Truncate description if needed
            if truncate and description:
                description = self._truncate_text(description)
            
            # Debug: List available actions
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            logger.info(f"Available YouTube actions: {action_names}")
            
            # Find the upload video action
            upload_action = None
            for action in actions:
                if action.name == "YOUTUBE_UPLOAD_VIDEO":
                    upload_action = action
                    break
            
            if not upload_action:
                logger.warning("YOUTUBE_UPLOAD_VIDEO action not found in list, attempting execution anyway...")
                try:
                    upload_action = Action.YOUTUBE_UPLOAD_VIDEO
                except AttributeError:
                    return {
                        "successful": False,
                        "error": "YOUTUBE_UPLOAD_VIDEO not available",
                        "video_id": None,
                        "video_url": None
                    }
            
            # Prepare parameters for YouTube Shorts upload
            # YouTube Shorts are vertical videos with aspect ratio 9:16
            # and typically less than 60 seconds
            params = {
                "title": title,
                "description": description,
                "tags": tags,
                "privacyStatus": privacy_status,
                "categoryId": "22",  # People & Blogs category
                "videoFilePath": upload_path
            }
            
            # Execute the upload action
            logger.info(f"Executing YouTube video upload with params: {params}")
            result = await self.composio_executor.execute_action(
                action=upload_action,
                params=params
            )
            
            if result.get("successful", False):
                video_id = result.get("data", {}).get("id")
                video_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else None
                
                logger.info(f"Successfully uploaded YouTube Short: {video_id}")
                return {
                    "successful": True,
                    "video_id": video_id,
                    "video_url": video_url,
                    "error": None
                }
            else:
                error_message = result.get("error", "Unknown error during upload")
                logger.error(f"Failed to upload YouTube Short: {error_message}")
                return {
                    "successful": False,
                    "error": error_message,
                    "video_id": None,
                    "video_url": None
                }
                
        except ComposioAuthRequired:
            raise
        except Exception as e:
            if "ComposioAuthRequired" in type(e).__name__:
                raise e
            logger.exception(f"Exception during YouTube Short upload: {str(e)}")
            return {
                "successful": False,
                "error": str(e),
                "video_id": None,
                "video_url": None
            }
        finally:
            # Clean up temp file if created
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"Removed temp file: {temp_file_path}")
                except Exception as cleanup_err:
                    logger.warning(f"Failed to remove temp file {temp_file_path}: {cleanup_err}")
