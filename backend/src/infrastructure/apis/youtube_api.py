# src/infrastructure/apis/youtube_api.py
import logging
import os
import tempfile
import requests
from typing import Dict, Any, Optional
import mimetypes
import hashlib
import json
from composio import Action
from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
from src import config
from src.utils.video_processor import prepare_video_for_shorts, get_video_duration

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
        truncate: bool = True,
        preprocess: bool = True
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
            preprocess: Whether to preprocess the video for Shorts format
            
        Returns:
            Dict with successful, video_id, video_url, error
        """
        logger.info(f"Uploading YouTube Short: {title}")
        
        if tags is None:
            tags = ["#Shorts"]
        elif "#Shorts" not in tags and "Shorts" not in tags:
            tags.append("#Shorts")
            
        temp_file_path = None
        processed_file_path = None
            
        try:
            # Ensure authentication
            await self._ensure_authentication()
            
            # Handle URL input by downloading to temp file
            if video_file_path.startswith("http://") or video_file_path.startswith("https://"):
                temp_file_path = self._download_video(video_file_path)
                upload_path = temp_file_path
            else:
                upload_path = video_file_path

            # Preprocess the video if requested or if duration > 60s
            if preprocess:
                try:
                    duration = get_video_duration(upload_path)
                    logger.info(f"Video duration: {duration}s")
                    
                    # Always process to ensure correct format (9:16, yuv420p, etc.)
                    # This is safer than relying on detection which might miss encoding nuances
                    processed_file_path = prepare_video_for_shorts(upload_path)
                    if processed_file_path != upload_path:
                        upload_path = processed_file_path
                        logger.info(f"Video preprocessed for Shorts format: {processed_file_path}")
                except Exception as e:
                    logger.warning(f"Failed to preprocess video: {str(e)}. Using original video.")

            # Truncate description if needed
            if truncate and description:
                description = self._truncate_text(description)
            
            # Make sure #Shorts is in the description AND title
            if "#Shorts" not in description:
                description = f"{description}\n#Shorts"
                
            # Some creators also add #Shorts to the title
            if "#Shorts" not in title:
                title = f"{title} #Shorts"

            try:
                upload_action = Action.YOUTUBE_UPLOAD_VIDEO
            except AttributeError:
                return {
                    "successful": False,
                    "error": "YOUTUBE_UPLOAD_VIDEO not available",
                    "video_id": None,
                    "video_url": None
                }
            
            # Upload file using ComposioExecutorService
            logger.info(f"Uploading file {upload_path} to Composio...")
            with open(upload_path, "rb") as f:
                file_content = f.read()
            
            mime_type, _ = mimetypes.guess_type(upload_path)
            if not mime_type:
                mime_type = "video/mp4"
                
            upload_data = await self.composio_executor.upload_file(
                file_name=os.path.basename(upload_path),
                file_content=file_content,
                content_type=mime_type
            )
            
            file_id = upload_data.get("id")
            s3_key = upload_data.get("key") or upload_data.get("fileKey") or file_id

            # Prepare parameters for YouTube Shorts upload
            params = {
                "title": title,
                "description": description,
                "tags": tags,
                "privacyStatus": privacy_status,
                "categoryId": "22",  # People & Blogs category
                "videoFilePath": {
                    "id": file_id,
                    "name": os.path.basename(upload_path),
                    "mimetype": mime_type,
                    "s3key": s3_key
                }
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
            
            # Clean up processed file if created and different from temp file
            if processed_file_path and os.path.exists(processed_file_path) and processed_file_path != temp_file_path:
                try:
                    os.remove(processed_file_path)
                    logger.info(f"Removed processed file: {processed_file_path}")
                except Exception as cleanup_err:
                    logger.warning(f"Failed to remove processed file {processed_file_path}: {cleanup_err}")
