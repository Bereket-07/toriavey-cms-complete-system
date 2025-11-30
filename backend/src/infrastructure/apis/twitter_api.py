# src/infrastructure/apis/twitter_api.py

import logging
from typing import Dict, Any
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
