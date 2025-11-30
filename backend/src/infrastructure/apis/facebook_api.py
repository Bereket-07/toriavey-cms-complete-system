# src/infrastructure/apis/facebook_api.py

import logging
from typing import Dict, Any, Optional
from composio import Action

from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
from src import config

logger = logging.getLogger(__name__)


class FacebookAPI:
    """
    Facebook API wrapper using Composio for social media integration.
    Uses FACEBOOK_CREATE_POST and FACEBOOK_CREATE_PHOTO_POST actions.
    """

    def __init__(self, entity_id: str):
        """Initialize Facebook API with Composio executor."""
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "FACEBOOK"
        self.max_message_length = 5000
        # You'll need to add FACEBOOK_PAGE_ID to your .env and config.py
        self.page_id = getattr(config, 'FACEBOOK_PAGE_ID', '')
        logger.info(f"FacebookAPI initialized for entity: {entity_id}, page_id: {self.page_id}")

    async def _ensure_authentication(self) -> None:
        """Ensure Facebook OAuth authentication."""
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )

    def _truncate_text(self, text: str, max_length: int = None) -> str:
        """Truncate text to fit Facebook's message limit."""
        if max_length is None:
            max_length = self.max_message_length
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."

    async def post_to_page(
        self,
        message: str,
        image_url: Optional[str] = None,
        page_id: Optional[str] = None,
        truncate: bool = True
    ) -> Dict[str, Any]:
        """
        Post to Facebook Page (text or photo).
        
        Args:
            message: Post message/text
            image_url: Optional URL of image to attach
            page_id: Facebook Page ID (uses config if not provided)
            truncate: Whether to auto-truncate message
            
        Returns:
            Dict with successful, post_id, post_url, error
        """
        logger.info(f"Posting to Facebook: {message[:50]}...")
        
        # Use provided page_id or fall back to config
        fb_page_id = page_id or self.page_id
        
        if not fb_page_id:
            logger.warning("No page_id provided - Facebook posting may fail without it")
            logger.info("To find your Page ID: Go to your Facebook Page → About → Page ID")
            # Continue anyway - Composio might handle it
            fb_page_id = ""  # Empty string instead of None
        
        try:
            # Ensure authentication
            await self._ensure_authentication()
            
            # Truncate message if needed
            if truncate and message:
                message = self._truncate_text(message)
            
            # Debug: List available actions
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            logger.info(f"Available Facebook actions: {action_names}")
            
            # Choose action based on whether we have an image
            if image_url:
                return await self._post_photo(fb_page_id, image_url, message, actions)
            else:
                return await self._post_text(fb_page_id, message, actions)
                
        except ComposioAuthRequired:
            raise
        except Exception as e:
            logger.error(f"Failed to post to Facebook: {e}", exc_info=True)
            return {
                "successful": False,
                "error": str(e),
                "post_id": None,
                "post_url": None
            }

    async def _post_text(
        self,
        page_id: str,
        message: str,
        actions: list
    ) -> Dict[str, Any]:
        """Post text-only to Facebook."""
        logger.info("Posting text to Facebook...")
        
        # Try to find action
        post_action = None
        for action in actions:
            if action.name == "FACEBOOK_CREATE_POST":
                post_action = action
                logger.info(f"Found action: {action.name}")
                break
        
        if not post_action:
            logger.warning("Action not in list, trying Action.FACEBOOK_CREATE_POST directly...")
            try:
                post_action = Action.FACEBOOK_CREATE_POST
            except AttributeError:
                logger.error("FACEBOOK_CREATE_POST not available")
                return {
                    "successful": False,
                    "error": f"FACEBOOK_CREATE_POST not available. Available: {', '.join([a.name for a in actions])}",
                    "post_id": None,
                    "post_url": None
                }
        
        # Execute post creation
        params = {
            "page_id": page_id,
            "message": message,
            "published": True
        }
        
        logger.info(f"Creating text post with params: {list(params.keys())}")
        result = await self.composio_executor.execute_action(
            action=post_action,
            params=params
        )
        
        logger.info(f"Post result: {result}")
        
        # Extract post ID
        post_id = None
        post_url = None
        if result.get('successful') and result.get('data'):
            data = result.get('data', {})
            post_id = data.get('id') or data.get('post_id')
            if post_id:
                post_url = f"https://www.facebook.com/{post_id}"
        
        logger.info(f"Facebook text post completed. Success: {result.get('successful')}, ID: {post_id}")
        
        return {
            **result,
            "post_id": post_id,
            "post_url": post_url
        }

    async def _post_photo(
        self,
        page_id: str,
        photo_url: str,
        message: str,
        actions: list
    ) -> Dict[str, Any]:
        """Post photo to Facebook."""
        logger.info("Posting photo to Facebook...")
        
        # Try to find action
        photo_action = None
        for action in actions:
            if action.name == "FACEBOOK_CREATE_PHOTO_POST":
                photo_action = action
                logger.info(f"Found action: {action.name}")
                break
        
        if not photo_action:
            logger.warning("Action not in list, trying Action.FACEBOOK_CREATE_PHOTO_POST directly...")
            try:
                photo_action = Action.FACEBOOK_CREATE_PHOTO_POST
            except AttributeError:
                logger.error("FACEBOOK_CREATE_PHOTO_POST not available")
                return {
                    "successful": False,
                    "error": f"FACEBOOK_CREATE_PHOTO_POST not available. Available: {', '.join([a.name for a in actions])}",
                    "post_id": None,
                    "post_url": None
                }
        
        # Execute photo post creation
        params = {
            "page_id": page_id,
            "url": photo_url,
            "message": message,
            "published": True
        }
        
        logger.info(f"Creating photo post with params: {list(params.keys())}")
        result = await self.composio_executor.execute_action(
            action=photo_action,
            params=params
        )
        
        logger.info(f"Photo post result: {result}")
        
        # Extract post ID
        post_id = None
        post_url = None
        if result.get('successful') and result.get('data'):
            data = result.get('data', {})
            post_id = data.get('id') or data.get('post_id')
            if post_id:
                post_url = f"https://www.facebook.com/{post_id}"
        
        logger.info(f"Facebook photo post completed. Success: {result.get('successful')}, ID: {post_id}")
        
        return {
            **result,
            "post_id": post_id,
            "post_url": post_url
        }

    async def get_available_actions(self) -> Dict[str, Any]:
        """Get all available Facebook actions from Composio."""
        try:
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            
            logger.info(f"Found {len(action_names)} Facebook actions")
            
            return {
                "successful": True,
                "actions": action_names,
                "count": len(action_names)
            }
        except Exception as e:
            logger.error(f"Failed to get Facebook actions: {e}")
            return {
                "successful": False,
                "error": str(e),
                "actions": []
            }
