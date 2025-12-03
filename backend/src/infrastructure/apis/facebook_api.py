# src/infrastructure/apis/facebook_api.py
import logging
from typing import Dict, Any, Optional
from composio import Action
from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
from src import config

logger = logging.getLogger(__name__)

class FacebookAPI:
    """
    Facebook API wrapper using Composio for video uploads (Reels).
    Uses FACEBOOK_POST_PAGE_VIDEO for posting reels.
    """

    def __init__(self, entity_id: str):
        """Initialize Facebook API with Composio executor."""
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "FACEBOOK"
        self.max_description_length = 5000 # Facebook is generous, but we'll stick to a reasonable limit
        self.page_id = config.FACEBOOK_PAGE_ID
        logger.info(f"FacebookAPI initialized for entity: {entity_id}, page_id: {self.page_id}")

    async def _ensure_authentication(self) -> None:
        """Ensure Facebook OAuth authentication."""
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )

    def _truncate_text(self, text: str, max_length: int = None) -> str:
        """Truncate text to fit Facebook's limit."""
        if max_length is None:
            max_length = self.max_description_length
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."

    async def upload_reel(
        self,
        video_url: str,
        caption: str = "",
        page_id: Optional[str] = None,
        title: Optional[str] = None,
        truncate: bool = True
    ) -> Dict[str, Any]:
        """
        Upload a reel (video) to Facebook Page using FACEBOOK_CREATE_VIDEO_POST.
        
        Args:
            video_url: URL of the video file
            caption: Video caption/description
            page_id: Facebook Page ID
            title: Video title
            truncate: Whether to auto-truncate description
            
        Returns:
            Dict with successful, post_id, post_url, error
        """
        logger.info(f"Uploading Facebook Reel: {caption[:50]}...")
        
        # Use provided page_id or fall back to config
        target_page_id = page_id or self.page_id
        
        if not target_page_id:
             logger.warning("No Facebook Page ID provided or configured. Upload might fail.")
             return {
                 "successful": False,
                 "error": "No Facebook Page ID configured",
                 "post_id": None,
                 "post_url": None
             }

        try:
            # Ensure authentication
            await self._ensure_authentication()
            
            # Truncate description if needed
            if truncate and caption:
                caption = self._truncate_text(caption)
            
            # Prepare parameters for FACEBOOK_CREATE_VIDEO_POST
            params = {
                "page_id": target_page_id,
                "file_url": video_url,
            }
            
            if caption:
                params["description"] = caption
            
            if title:
                params["title"] = title
            
            # Execute the upload action
            logger.info(f"Executing FACEBOOK_CREATE_VIDEO_POST with params: {params}")
            
            # We use the action enum if available, or string name
            try:
                action = Action.FACEBOOK_CREATE_VIDEO_POST
            except AttributeError:
                # Fallback if enum not updated yet, though Composio usually has it
                logger.warning("Action.FACEBOOK_CREATE_VIDEO_POST not found in Enum, using string lookup")
                # This part is tricky if we can't pass string to execute_action directly if it expects Enum
                # But ComposioExecutorService might handle it or we search for it
                actions = await self.composio_executor.get_actions_for_app(self.app_name)
                action = next((a for a in actions if a.name == "FACEBOOK_CREATE_VIDEO_POST"), None)
                
                if not action:
                     return {
                        "successful": False,
                        "error": "FACEBOOK_CREATE_VIDEO_POST action not found",
                        "post_id": None,
                        "post_url": None
                    }

            result = await self.composio_executor.execute_action(
                action=action,
                params=params
            )
            
            if result.get("successful", False):
                post_id = result.get("data", {}).get("id")
                # Constructing a generic URL
                post_url = f"https://www.facebook.com/{post_id}" if post_id else None
                
                logger.info(f"Successfully uploaded Facebook Reel: {post_id}")
                return {
                    "successful": True,
                    "post_id": post_id,
                    "post_url": post_url,
                    "error": None
                }
            else:
                error_message = result.get("error", "Unknown error during upload")
                logger.error(f"Failed to upload Facebook Reel: {error_message}")
                return {
                    "successful": False,
                    "error": error_message,
                    "post_id": None,
                    "post_url": None
                }
                
        except ComposioAuthRequired:
            raise
        except Exception as e:
            if "ComposioAuthRequired" in type(e).__name__:
                raise e
            logger.exception(f"Exception during Facebook Reel upload: {str(e)}")
            return {
                "successful": False,
                "error": str(e),
                "post_id": None,
                "post_url": None
            }

    async def post_to_page(
        self,
        message: str,
        image_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Post text or image to Facebook Page.
        Used by ManageContentUseCase.
        """
        logger.info(f"Posting to Facebook Page: {message[:50]}...")
        
        if not self.page_id:
            logger.warning("No Facebook Page ID configured. Post might fail if action requires it.")

        try:
            await self._ensure_authentication()
            
            # Check for available actions
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            
            # Prefer photo post if image provided
            if image_url:
                post_action = None
                for action in actions:
                    if action.name == "FACEBOOK_CREATE_PHOTO_POST":
                        post_action = action
                        break
                
                if post_action:
                    logger.info("Using FACEBOOK_CREATE_PHOTO_POST")
                    params = {
                        "message": message,
                        "url": image_url
                    }
                    if self.page_id:
                        params["page_id"] = self.page_id
                        
                    return await self.composio_executor.execute_action(
                        action=post_action,
                        params=params
                    )
                else:
                    # Try fallback to Enum
                    try:
                        post_action = Action.FACEBOOK_CREATE_PHOTO_POST
                        logger.info("Using FACEBOOK_CREATE_PHOTO_POST (from Enum)")
                        params = {
                            "message": message,
                            "url": image_url
                        }
                        if self.page_id:
                            params["page_id"] = self.page_id

                        return await self.composio_executor.execute_action(
                            action=post_action,
                            params=params
                        )
                    except AttributeError:
                        return {
                            "successful": False,
                            "error": "FACEBOOK_CREATE_PHOTO_POST not available",
                            "post_id": None,
                            "post_url": None
                        }
            
            if not image_url:
                 return {
                    "successful": False,
                    "error": "Text-only posting not currently supported by available actions (only FACEBOOK_CREATE_PHOTO_POST found)",
                    "post_id": None,
                    "post_url": None
                }
                
            return {
                "successful": False,
                "error": "No suitable action found for posting",
                "post_id": None,
                "post_url": None
            }

        except ComposioAuthRequired:
            raise
        except Exception as e:
            if "ComposioAuthRequired" in type(e).__name__:
                raise e
            logger.exception(f"Exception during Facebook Page post: {str(e)}")
            return {
                "successful": False,
                "error": str(e),
                "post_id": None,
                "post_url": None
            }
