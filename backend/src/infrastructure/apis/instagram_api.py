# src/infrastructure/apis/instagram_api.py

import logging
from typing import Dict, Any, Optional
from composio import Action

from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
from src import config

logger = logging.getLogger(__name__)


class InstagramAPI:
    """
    Instagram API wrapper using Composio for social media integration.
    Uses INSTAGRAM_CREATE_MEDIA_CONTAINER and INSTAGRAM_CREATE_POST for posting.
    """

    def __init__(self, entity_id: str):
        """Initialize Instagram API with Composio executor."""
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "INSTAGRAM"
        self.max_caption_length = 2200
        self.ig_user_id = config.INSTAGRAM_BUSINESS_ACCOUNT_ID
        logger.info(f"InstagramAPI initialized for entity: {entity_id}, ig_user_id: {self.ig_user_id}")

    async def _ensure_authentication(self) -> None:
        """Ensure Instagram OAuth authentication."""
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )

    def _truncate_text(self, text: str, max_length: int = None) -> str:
        """Truncate text to fit Instagram's caption limit."""
        if max_length is None:
            max_length = self.max_caption_length
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."

    async def post_image(
        self,
        image_url: str,
        caption: str = "",
        ig_user_id: Optional[str] = None,
        truncate: bool = True
    ) -> Dict[str, Any]:
        """
        Post an image to Instagram using two-step process:
        1. INSTAGRAM_CREATE_MEDIA_CONTAINER
        2. INSTAGRAM_CREATE_POST
        
        Args:
            image_url: URL of the image to post
            caption: Image caption
            ig_user_id: Instagram user ID (uses config if not provided)
            truncate: Whether to auto-truncate caption
            
        Returns:
            Dict with successful, post_id, post_url, error
        """
        logger.info(f"Posting Instagram image: {caption[:50]}...")
        
        # Use provided ig_user_id or fall back to config
        user_id = ig_user_id or self.ig_user_id
        
        if not user_id:
            logger.error("No ig_user_id provided or configured!")
            return {
                "successful": False,
                "error": "Instagram user ID is required",
                "post_id": None,
                "post_url": None
            }
        
        try:
            # Ensure authentication
            await self._ensure_authentication()
            
            # Truncate caption if needed
            if truncate and caption:
                caption = self._truncate_text(caption)
            
            # Debug: List available actions
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            logger.info(f"Available Instagram actions: {action_names}")
            
            # STEP 1: Try to create media container using full action name
            logger.info("Attempting to create media container...")
            
            # Try to find the action by full name
            container_action = None
            for action in actions:
                if action.name == "INSTAGRAM_CREATE_MEDIA_CONTAINER":
                    container_action = action
                    logger.info(f"Found action: {action.name}")
                    break
            
            if not container_action:
                # Try using Action enum directly
                logger.warning("Action not in list, trying Action.INSTAGRAM_CREATE_MEDIA_CONTAINER directly...")
                try:
                    container_action = Action.INSTAGRAM_CREATE_MEDIA_CONTAINER
                except AttributeError:
                    logger.error("INSTAGRAM_CREATE_MEDIA_CONTAINER not available in Action enum")
                    return {
                        "successful": False,
                        "error": f"INSTAGRAM_CREATE_MEDIA_CONTAINER not available. Available: {', '.join(action_names)}",
                        "post_id": None,
                        "post_url": None
                    }
            
            # Execute container creation
            container_params = {
                "ig_user_id": user_id,
                "image_url": image_url,
                "caption": caption
            }
            
            logger.info(f"Creating container with params: {list(container_params.keys())}")
            container_result = await self.composio_executor.execute_action(
                action=container_action,
                params=container_params
            )
            
            logger.info(f"Container result: {container_result}")
            
            if not container_result.get('successful'):
                error_msg = container_result.get('error', 'Unknown error')
                logger.error(f"Container creation failed: {error_msg}")
                return {
                    "successful": False,
                    "error": error_msg,
                    "post_id": None,
                    "post_url": None
                }
            
            # Extract creation_id
            creation_id = container_result.get('data', {}).get('id')
            if not creation_id:
                logger.error("No creation_id in container result")
                return {
                    "successful": False,
                    "error": "No creation_id returned",
                    "post_id": None,
                    "post_url": None
                }
            
            logger.info(f"Container created with ID: {creation_id}")
            
            # STEP 2: Create post
            post_action = None
            for action in actions:
                if action.name == "INSTAGRAM_CREATE_POST":
                    post_action = action
                    break
            
            if not post_action:
                try:
                    post_action = Action.INSTAGRAM_CREATE_POST
                except AttributeError:
                    return {
                        "successful": False,
                        "error": "INSTAGRAM_CREATE_POST not available",
                        "post_id": None,
                        "post_url": None
                    }
            
            post_params = {
                "ig_user_id": user_id,
                "creation_id": creation_id
            }
            
            logger.info(f"Creating post with params: {list(post_params.keys())}")
            post_result = await self.composio_executor.execute_action(
                action=post_action,
                params=post_params
            )
            
            logger.info(f"Post result: {post_result}")
            
            # Extract post ID
            post_id = None
            post_url = None
            if post_result.get('successful') and post_result.get('data'):
                data = post_result.get('data', {})
                post_id = data.get('id') or data.get('post_id')
                if post_id:
                    post_url = f"https://www.instagram.com/p/{post_id}/"
            
            logger.info(f"Instagram post completed. Success: {post_result.get('successful')}, ID: {post_id}")
            
            return {
                **post_result,
                "post_id": post_id,
                "post_url": post_url
            }
            
        except ComposioAuthRequired:
            raise
        except Exception as e:
            logger.error(f"Failed to post to Instagram: {e}", exc_info=True)
            return {
                "successful": False,
                "error": str(e),
                "post_id": None,
                "post_url": None
            }

    async def post_video(
        self,
        video_url: str,
        caption: str = "",
        ig_user_id: Optional[str] = None,
        truncate: bool = True
    ) -> Dict[str, Any]:
        """Post a video to Instagram (placeholder)."""
        logger.warning("Instagram video posting not fully implemented yet")
        return {
            "successful": False,
            "error": "Video posting not yet implemented",
            "post_id": None,
            "post_url": None
        }

    async def get_available_actions(self) -> Dict[str, Any]:
        """Get all available Instagram actions from Composio."""
        try:
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            
            logger.info(f"Found {len(action_names)} Instagram actions")
            
            return {
                "successful": True,
                "actions": action_names,
                "count": len(action_names)
            }
        except Exception as e:
            logger.error(f"Failed to get Instagram actions: {e}")
            return {
                "successful": False,
                "error": str(e),
                "actions": []
            }
