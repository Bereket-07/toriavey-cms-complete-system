# src/infrastructure/apis/twitter_api.py
 
import logging
import base64
from typing import Dict, Any, List, Optional
 
import requests
from composio import Action
 
from src.infrastructure.apis.composio import ComposioExecutorService, ComposioAuthRequired
 
logger = logging.getLogger(__name__)
 
 
class TwitterAPI:
    """
    Twitter/X API wrapper using Composio for social media integration.
    Uses TWITTER_CREATION_OF_A_POST action for posting text-only tweets.
    """
 
    def __init__(self, entity_id: str):
        """Initialize Twitter API with Composio executor."""
        self.entity_id = entity_id
        self.composio_executor = ComposioExecutorService(entity_id=entity_id)
        self.app_name = "TWITTER"
        self.max_tweet_length = 280
        logger.info(f"TwitterAPI initialized for entity: {entity_id}")
 
    # ------------------------------------------------------------------ #
    # Composio Twitter media posting is a 3-step chain and its exact action
    # names / parameter keys could not be verified offline. The values below
    # are best-effort defaults; confirm them with get_available_actions() and
    # the logged action names, and adjust if a live post fails.
    # ------------------------------------------------------------------ #
    _UPLOAD_ACTION_MATCH = ("MEDIA", "UPLOAD")     # action name must contain both
    _UPLOAD_MEDIA_PARAM = "media"                  # param key for the media bytes (base64)
    _POST_MEDIA_IDS_PARAM = "media__media_ids"     # create-post param for attached media ids
 
    async def _ensure_authentication(self) -> None:
        """Ensure Twitter OAuth2 authentication."""
        await self.composio_executor.check_and_handle_authentication(
            app_name=self.app_name
        )
 
    def _truncate_text(self, text: str, max_length: int = None) -> str:
        """Truncate text to fit Twitter's character limit."""
        if max_length is None:
            max_length = self.max_tweet_length
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
 
    async def post_tweet(
        self,
        text: str,
        truncate: bool = True
    ) -> Dict[str, Any]:
        """
        Post a text-only tweet using TWITTER_CREATION_OF_A_POST.
        
        Args:
            text: Tweet text (will be truncated to 280 chars if truncate=True)
            truncate: Whether to auto-truncate text
            
        Returns:
            Dict with successful, tweet_id, tweet_url, error
        """
        logger.info(f"Posting tweet: {text[:50]}...")
        
        try:
            # Ensure OAuth2 authentication
            await self._ensure_authentication()
            
            # Truncate text if needed
            if truncate:
                text = self._truncate_text(text)
            
            # Find the tweet creation action dynamically
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            post_action = None
            
            for action in actions:
                if "CREATION_OF_A_POST" in action.name.upper():
                    post_action = action
                    logger.info(f"Using Twitter action: {action.name}")
                    break
            
            if not post_action:
                raise ValueError("Could not find TWITTER_CREATION_OF_A_POST action")
            
            # Execute the action with text only
            result = await self.composio_executor.execute_action(
                action=post_action,
                params={"text": text}
            )
            
            # Extract tweet ID and URL
            tweet_id = None
            tweet_url = None
            if result.get('successful') and result.get('data'):
                data = result.get('data', {})
                tweet_id = data.get('id') or data.get('tweet_id')
                if tweet_id:
                    tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"
            
            logger.info(f"Tweet posted. Success: {result.get('successful')}, ID: {tweet_id}")
            
            return {
                **result,
                "tweet_id": tweet_id,
                "tweet_url": tweet_url
            }
            
        except ComposioAuthRequired:
            # Re-raise auth required exception
            raise
        except Exception as e:
            logger.error(f"Error posting tweet: {str(e)}")
            return {
                "successful": False,
                "error": str(e),
                "tweet_id": None,
                "tweet_url": None
            }
 
    async def get_available_actions(self) -> Dict[str, Any]:
        """Get all available Twitter actions from Composio.
 
        Useful for confirming the exact action names used by post_tweet and
        post_tweet_with_media (see the _UPLOAD_ACTION_MATCH / param constants).
        """
        try:
            actions = await self.composio_executor.get_actions_for_app(self.app_name)
            action_names = [action.name for action in actions]
            logger.info(f"Found {len(action_names)} Twitter actions")
            return {
                "successful": True,
                "actions": action_names,
                "count": len(action_names),
            }
        except Exception as e:
            logger.error(f"Failed to get Twitter actions: {e}")
            return {"successful": False, "error": str(e), "actions": []}
 
    async def _find_action(self, *name_parts: str):
        """Find the first Twitter action whose name contains all given substrings."""
        actions = await self.composio_executor.get_actions_for_app(self.app_name)
        for action in actions:
            name = action.name.upper()
            if all(part.upper() in name for part in name_parts):
                logger.info(f"Using Twitter action: {action.name}")
                return action
        return None
 
    async def post_tweet_with_media(
        self,
        text: str,
        media_url: str,
        media_type: str = "image",
        truncate: bool = True,
    ) -> Dict[str, Any]:
        """
        Post a tweet with an attached image.
 
        Chain: download media -> upload to Twitter (get media_id) -> create post
        with the media_id attached. Returns the same shape as post_tweet
        (successful, tweet_id, tweet_url, error).
 
        NOTE: the Composio media action names/params are best-effort (see the
        class-level constants). If a live post fails on the media step, call
        get_available_actions() to confirm the real names and adjust.
        """
        logger.info(f"Posting tweet with media: {text[:50]}... media={media_url}")
 
        try:
            await self._ensure_authentication()
 
            if truncate:
                text = self._truncate_text(text)
 
            # 1) Download the media bytes and base64-encode them.
            try:
                resp = requests.get(media_url, timeout=15)
                resp.raise_for_status()
                media_b64 = base64.b64encode(resp.content).decode("utf-8")
            except Exception as e:  # noqa: BLE001
                return {"successful": False, "error": f"Could not fetch media: {e}",
                        "tweet_id": None, "tweet_url": None}
 
            # 2) Upload the media to obtain a media_id.
            upload_action = await self._find_action(*self._UPLOAD_ACTION_MATCH)
            if not upload_action:
                return {"successful": False,
                        "error": "Could not find a Twitter media-upload action in Composio. "
                                 "Call get_available_actions() to find the correct name.",
                        "tweet_id": None, "tweet_url": None}
 
            upload_result = await self.composio_executor.execute_action(
                action=upload_action,
                params={self._UPLOAD_MEDIA_PARAM: media_b64, "media_category": f"tweet_{media_type}"},
            )
            if not upload_result.get("successful"):
                return {"successful": False,
                        "error": f"Media upload failed: {upload_result.get('error')}",
                        "tweet_id": None, "tweet_url": None}
 
            up_data = upload_result.get("data", {}) or {}
            media_id = up_data.get("media_id_string") or up_data.get("media_id") or up_data.get("id")
            if not media_id:
                return {"successful": False,
                        "error": f"Media uploaded but no media_id in response: {up_data}",
                        "tweet_id": None, "tweet_url": None}
 
            # 3) Create the post with the media attached.
            post_action = await self._find_action("CREATION_OF_A_POST")
            if not post_action:
                raise ValueError("Could not find TWITTER_CREATION_OF_A_POST action")
 
            result = await self.composio_executor.execute_action(
                action=post_action,
                params={"text": text, self._POST_MEDIA_IDS_PARAM: [str(media_id)]},
            )
 
            tweet_id = None
            tweet_url = None
            if result.get("successful") and result.get("data"):
                data = result.get("data", {})
                tweet_id = data.get("id") or data.get("tweet_id")
                if tweet_id:
                    tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"
 
            logger.info(f"Tweet w/ media posted. Success: {result.get('successful')}, ID: {tweet_id}")
            return {**result, "tweet_id": tweet_id, "tweet_url": tweet_url}
 
        except ComposioAuthRequired:
            raise
        except Exception as e:
            logger.error(f"Error posting tweet with media: {str(e)}")
            return {"successful": False, "error": str(e), "tweet_id": None, "tweet_url": None}
 