# src/infrastructure/apis/facebook_api.py
#
# Facebook API wrapper using Composio (new `composio` 0.17.x SDK).
# Actions are plain string slugs (e.g. "FACEBOOK_CREATE_POST").
#
# Supports:
#   - post_to_page(message, image_url=None, page_id=None)  -> text or photo post
#   - upload_reel(video_url, caption, page_id, title)      -> video/reel post
#
# All methods return a consistent shape:
#   {"successful": bool, "post_id": str|None, "post_url": str|None, "error": str|None}
import logging
from typing import Dict, Any, Optional
 
from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
from src import config
 
logger = logging.getLogger(__name__)
 
 
class FacebookAPI:
    """Facebook Page publishing via Composio (text, photo, and video/reel posts)."""
 
    # Action slugs (confirmed against the live Composio Facebook toolkit).
    ACTION_TEXT_POST = "FACEBOOK_CREATE_POST"
    ACTION_PHOTO_POST = "FACEBOOK_CREATE_PHOTO_POST"
    ACTION_VIDEO_POST = "FACEBOOK_CREATE_VIDEO_POST"
 
    def __init__(self, entity_id: str):
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "FACEBOOK"
        self.max_description_length = 5000
        self.page_id = config.FACEBOOK_PAGE_ID
        logger.info(f"FacebookAPI initialized for entity: {entity_id}, page_id: {self.page_id}")
 
    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    async def _ensure_authentication(self) -> None:
        """Ensure Facebook is connected; raises ComposioAuthRequired if OAuth needed."""
        await self.composio_executor.check_and_handle_authentication(app_name=self.app_name)
 
    def _truncate_text(self, text: str, max_length: Optional[int] = None) -> str:
        if max_length is None:
            max_length = self.max_description_length
        if not text or len(text) <= max_length:
            return text
        return text[: max_length - 3] + "..."
 
    @staticmethod
    def _normalize(result: Any) -> Dict[str, Any]:
        """
        Turn a Composio result (envelope {data,error,successful} OR already-normalized dict)
        into the consistent shape {successful, post_id, post_url, error}.
        """
        # Already normalized?
        if isinstance(result, dict) and "post_id" in result and "successful" in result:
            return result
 
        successful = False
        data: Dict[str, Any] = {}
        error = None
        if isinstance(result, dict):
            successful = bool(result.get("successful"))
            data = result.get("data") or {}
            error = result.get("error")
        # Facebook post ids look like "<pageid>_<postid>"
        post_id = None
        if isinstance(data, dict):
            post_id = data.get("id") or data.get("post_id")
        post_url = f"https://www.facebook.com/{post_id}" if post_id else None
        if not successful and error is None:
            error = "Unknown error (no data returned)"
        return {
            "successful": successful,
            "post_id": post_id,
            "post_url": post_url,
            "error": None if successful else error,
        }
 
    def _error(self, message: str) -> Dict[str, Any]:
        return {"successful": False, "post_id": None, "post_url": None, "error": message}
 
    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    async def post_to_page(
        self,
        message: str,
        image_url: Optional[str] = None,
        page_id: Optional[str] = None,
        truncate: bool = True,
    ) -> Dict[str, Any]:
        """
        Post text (FACEBOOK_CREATE_POST) or a photo (FACEBOOK_CREATE_PHOTO_POST) to a Page.
 
        Args:
            message: post text / photo caption
            image_url: if given, publishes a photo post with this image URL
            page_id: target Page id (falls back to config.FACEBOOK_PAGE_ID)
            truncate: auto-truncate long messages
        Returns:
            {"successful", "post_id", "post_url", "error"}
        """
        target_page_id = page_id or self.page_id
        logger.info(f"Posting to Facebook Page {target_page_id}: {message[:50]}...")
 
        if not target_page_id:
            return self._error("No Facebook Page ID provided or configured.")
 
        try:
            await self._ensure_authentication()
 
            if truncate and message:
                message = self._truncate_text(message)
 
            if image_url:
                logger.info("Using FACEBOOK_CREATE_PHOTO_POST")
                params = {"page_id": target_page_id, "message": message, "url": image_url}
                action = self.ACTION_PHOTO_POST
            else:
                logger.info("Using FACEBOOK_CREATE_POST")
                params = {"page_id": target_page_id, "message": message}
                action = self.ACTION_TEXT_POST
 
            result = await self.composio_executor.execute_action(action=action, params=params)
            normalized = self._normalize(result)
            logger.info(
                f"Facebook post done. success={normalized['successful']} id={normalized['post_id']}"
            )
            return normalized
 
        except ComposioAuthRequired:
            raise
        except Exception as e:  # noqa: BLE001
            if "ComposioAuthRequired" in type(e).__name__:
                raise
            logger.exception(f"Exception during Facebook Page post: {e}")
            return self._error(str(e))
 
    async def upload_reel(
        self,
        video_url: str,
        caption: str = "",
        page_id: Optional[str] = None,
        title: Optional[str] = None,
        truncate: bool = True,
    ) -> Dict[str, Any]:
        """
        Publish a video/reel to a Page (FACEBOOK_CREATE_VIDEO_POST).
 
        Returns: {"successful", "post_id", "post_url", "error"}
        """
        target_page_id = page_id or self.page_id
        logger.info(f"Uploading Facebook video to Page {target_page_id}: {caption[:50]}...")
 
        if not target_page_id:
            return self._error("No Facebook Page ID provided or configured.")
        if not video_url:
            return self._error("No video_url provided.")
 
        try:
            await self._ensure_authentication()
 
            if truncate and caption:
                caption = self._truncate_text(caption)
 
            params: Dict[str, Any] = {"page_id": target_page_id, "file_url": video_url}
            if caption:
                params["description"] = caption
            if title:
                params["title"] = title
 
            logger.info(f"Executing FACEBOOK_CREATE_VIDEO_POST for page {target_page_id}")
            result = await self.composio_executor.execute_action(
                action=self.ACTION_VIDEO_POST, params=params
            )
            normalized = self._normalize(result)
            logger.info(
                f"Facebook video done. success={normalized['successful']} id={normalized['post_id']}"
            )
            return normalized
 
        except ComposioAuthRequired:
            raise
        except Exception as e:  # noqa: BLE001
            if "ComposioAuthRequired" in type(e).__name__:
                raise
            logger.exception(f"Exception during Facebook video upload: {e}")
            return self._error(str(e))
 
    async def get_available_actions(self) -> Dict[str, Any]:
        """List available Facebook action slugs (useful for debugging param/action names)."""
        try:
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            names = list(actions)
            return {"successful": True, "actions": names, "count": len(names)}
        except Exception as e:  # noqa: BLE001
            logger.error(f"Failed to get Facebook actions: {e}")
            return {"successful": False, "error": str(e), "actions": []}
 