# src/infrastructure/apis/wordpress_api.py
 
import logging
from typing import Dict, Any, Optional
 
from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
 
logger = logging.getLogger(__name__)
 
 
class WordPressAPI:
    """
    WordPress API wrapper using Composio, mirroring the other platform APIs.
 
    Creates WordPress posts (title + content, as draft or published). Uses
    dynamic Composio action discovery so no action enum is hard-coded.
 
    IMPORTANT (verify against your live Composio account):
      - The action match looks for a WordPress action whose name contains
        "CREATE"/"CREATION" and "POST". The chosen action name is logged at
        runtime - confirm it matches what your Composio WordPress app exposes.
      - The execute params use keys "title", "content", "status". If the
        Composio WordPress action expects different field names, adjust the
        _PARAM_* constants below.
    """
 
    # Parameter keys the Composio WordPress create-post action expects.
    # Adjust if your action's schema differs (action names are logged at runtime).
    _PARAM_TITLE = "title"
    _PARAM_CONTENT = "content"
    _PARAM_STATUS = "status"
    _PARAM_EXCERPT = "excerpt"
 
    def __init__(self, entity_id: str):
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "WORDPRESS"
        logger.info(f"WordPressAPI initialized for entity: {entity_id}")
 
    async def _ensure_authentication(self) -> None:
        """Ensure WordPress authentication via Composio."""
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )
 
    async def get_available_actions(self) -> Dict[str, Any]:
        """Get all available WordPress actions from Composio.
 
        Useful for confirming the exact create-post action name and params.
        """
        try:
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            logger.info(f"Found {len(action_names)} WordPress actions")
            return {
                "successful": True,
                "actions": action_names,
                "count": len(action_names),
            }
        except Exception as e:
            logger.error(f"Failed to get WordPress actions: {e}")
            return {"successful": False, "error": str(e), "actions": []}
 
    async def _find_post_action(self):
        """Discover the WordPress create-post action dynamically."""
        actions = await self.composio_executor.get_actions_for_app(self.app_name)
        for action in actions:
            name = action.name.upper()
            if "POST" in name and any(k in name for k in ("CREATE", "CREATION")):
                logger.info(f"Using WordPress action: {action.name}")
                return action
        return None
 
    async def create_post(
        self,
        title: str,
        content: str,
        status: str = "draft",
        excerpt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a WordPress post.
 
        Args:
            title: Post title.
            content: Post body (HTML or plain text).
            status: "draft" (default) or "publish".
            excerpt: Optional short excerpt.
 
        Returns:
            Dict with successful, post_id, post_url, error.
        """
        logger.info(f"Creating WordPress post: {title[:50]}... (status={status})")
 
        try:
            await self._ensure_authentication()
 
            post_action = await self._find_post_action()
            if not post_action:
                raise ValueError(
                    "Could not find a WordPress create-post action in Composio. "
                    "Call get_available_actions() to find the correct name."
                )
 
            params = {
                self._PARAM_TITLE: title,
                self._PARAM_CONTENT: content,
                self._PARAM_STATUS: status,
            }
            if excerpt:
                params[self._PARAM_EXCERPT] = excerpt
 
            result = await self.composio_executor.execute_action(
                action=post_action,
                params=params,
            )
 
            post_id = None
            post_url = None
            if result.get("successful") and result.get("data"):
                data = result.get("data", {})
                post_id = data.get("id") or data.get("post_id")
                post_url = data.get("link") or data.get("url") or data.get("guid")
 
            logger.info(f"WordPress post done. Success: {result.get('successful')}, ID: {post_id}")
 
            return {
                **result,
                "post_id": post_id,
                "post_url": post_url,
            }
 
        except ComposioAuthRequired:
            raise
        except Exception as e:
            logger.error(f"Error creating WordPress post: {str(e)}")
            return {
                "successful": False,
                "error": str(e),
                "post_id": None,
                "post_url": None,
            }
 