# src/infrastructure/apis/direct/twitter_direct_api.py

import logging
from typing import Dict, Any, Optional
import tweepy
import httpx

logger = logging.getLogger(__name__)


class TwitterDirectAPI:
    """
    Direct Twitter API v1.1 integration using Tweepy.
    Uses OAuth 1.0a for authentication.
    """

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        access_token: str,
        access_token_secret: str
    ):
        """Initialize Twitter API with credentials."""
        self.api_key = api_key
        self.api_secret = api_secret
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.max_tweet_length = 280
        
        # Initialize API v1.1 (your app only has v1.1 access)
        auth = tweepy.OAuth1UserHandler(
            api_key,
            api_secret,
            access_token,
            access_token_secret
        )
        self.api = tweepy.API(auth)
        
        logger.info("TwitterDirectAPI initialized with Tweepy v1.1")

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
        Post a text-only tweet using API v1.1.
        
        Args:
            text: Tweet text (will be truncated to 280 chars if truncate=True)
            truncate: Whether to auto-truncate text
            
        Returns:
            Dict with successful, tweet_id, tweet_url, error
        """
        logger.info(f"Posting tweet: {text[:50]}...")
        
        try:
            # Truncate text if needed
            if truncate:
                text = self._truncate_text(text)
            
            # Post tweet using Tweepy API v1.1
            status = self.api.update_status(status=text)
            
            if status:
                tweet_id = str(status.id)
                tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"
                
                logger.info(f"Tweet posted successfully. ID: {tweet_id}")
                
                return {
                    "successful": True,
                    "tweet_id": tweet_id,
                    "tweet_url": tweet_url,
                    "data": status._json
                }
            else:
                logger.error("Failed to post tweet: No response")
                return {
                    "successful": False,
                    "error": "No response from Twitter",
                    "tweet_id": None,
                    "tweet_url": None
                }
                
        except tweepy.TweepyException as e:
            logger.error(f"Tweepy error: {e}", exc_info=True)
            return {
                "successful": False,
                "error": f"Twitter API error: {str(e)}",
                "tweet_id": None,
                "tweet_url": None
            }
        except Exception as e:
            logger.error(f"Failed to post tweet: {e}", exc_info=True)
            return {
                "successful": False,
                "error": str(e),
                "tweet_id": None,
                "tweet_url": None
            }

    async def upload_media(self, media_url: str) -> Optional[str]:
        """
        Upload media to Twitter and get media_id.
        
        Args:
            media_url: URL of the media to upload
            
        Returns:
            media_id string or None if failed
        """
        logger.info(f"Uploading media from: {media_url}")
        
        try:
            # Download media first
            async with httpx.AsyncClient() as client:
                media_response = await client.get(media_url, timeout=30.0)
                
                if media_response.status_code != 200:
                    logger.error(f"Failed to download media: {media_response.status_code}")
                    return None
                
                media_data = media_response.content
            
            # Save temporarily
            import tempfile
            import os
            
            # Determine file extension from content type
            content_type = media_response.headers.get("content-type", "image/jpeg")
            ext = ".jpg" if "jpeg" in content_type else ".png" if "png" in content_type else ".mp4" if "video" in content_type else ".jpg"
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
                tmp_file.write(media_data)
                tmp_path = tmp_file.name
            
            try:
                # Upload using Tweepy API v1.1
                media = self.api.media_upload(tmp_path)
                media_id = media.media_id_string
                logger.info(f"Media uploaded successfully. ID: {media_id}")
                return media_id
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                
        except Exception as e:
            logger.error(f"Failed to upload media: {e}", exc_info=True)
            return None

    async def post_tweet_with_media(
        self,
        text: str,
        media_url: str,
        truncate: bool = True
    ) -> Dict[str, Any]:
        """
        Post a tweet with media using API v1.1.
        
        Args:
            text: Tweet text
            media_url: URL of media to attach
            truncate: Whether to auto-truncate text
            
        Returns:
            Dict with successful, tweet_id, tweet_url, error
        """
        logger.info(f"Posting tweet with media: {text[:50]}...")
        
        try:
            # Upload media first
            media_id = await self.upload_media(media_url)
            
            if not media_id:
                # Fall back to text-only
                logger.warning("Media upload failed, posting text only")
                return await self.post_tweet(text, truncate)
            
            # Truncate text if needed
            if truncate:
                text = self._truncate_text(text)
            
            # Post tweet with media using API v1.1
            status = self.api.update_status(
                status=text,
                media_ids=[media_id]
            )
            
            if status:
                tweet_id = str(status.id)
                tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"
                
                logger.info(f"Tweet with media posted successfully. ID: {tweet_id}")
                
                return {
                    "successful": True,
                    "tweet_id": tweet_id,
                    "tweet_url": tweet_url,
                    "data": status._json
                }
            else:
                logger.error("Failed to post tweet with media: No response")
                return {
                    "successful": False,
                    "error": "No response from Twitter",
                    "tweet_id": None,
                    "tweet_url": None
                }
                
        except tweepy.TweepyException as e:
            logger.error(f"Tweepy error: {e}", exc_info=True)
            return {
                "successful": False,
                "error": f"Twitter API error: {str(e)}",
                "tweet_id": None,
                "tweet_url": None
            }
        except Exception as e:
            logger.error(f"Failed to post tweet with media: {e}", exc_info=True)
            return {
                "successful": False,
                "error": str(e),
                "tweet_id": None,
                "tweet_url": None
            }
