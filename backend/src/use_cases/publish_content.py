# src/use_cases/publish_content.py
"""Publish generated content to social platforms (WBS 2.0 posting orchestration).
 
This is the unified publish path the posting system was missing: it takes the
per-platform content the generator produces (caption + hashtags + optional
image) and routes each item to the correct platform API, returning a per-platform
result. It supports the text/image platforms (Instagram, Twitter/X, Facebook);
video platforms (YouTube, reels) are handled by the separate clips pipeline.
 
The individual platform APIs are Composio-backed and construct lazily, so this
use case is safe to build without live credentials; actual posting requires the
relevant accounts to be connected in Composio for the given entity_id.
"""
 
import asyncio
import logging
from typing import Dict, Any, List, Optional
 
from src.domain.models.content_model import ContentPlatform
from src.infrastructure.apis.instagram_api import InstagramAPI
from src.infrastructure.apis.twitter_api import TwitterAPI
from src.infrastructure.apis.facebook_api import FacebookAPI
from src.infrastructure.apis.composio import ComposioAuthRequired
 
logger = logging.getLogger(__name__)
 
# Platforms this publisher can post text/image content to.
SUPPORTED_PLATFORMS = {ContentPlatform.INSTAGRAM, ContentPlatform.TWITTER, ContentPlatform.FACEBOOK}
 
 
def _compose_text(caption: str, hashtags: Optional[List[str]], link: Optional[str]) -> str:
    """Combine caption, hashtags, and an optional link into post text."""
    parts = [caption.strip()] if caption else []
    if hashtags:
        tags = " ".join(f"#{h.lstrip('#')}" for h in hashtags if h)
        if tags:
            parts.append(tags)
    if link:
        parts.append(link)
    return "\n\n".join(parts)
 
 
class PublishContentUseCase:
    """Routes per-platform content to the appropriate platform API and aggregates results."""
 
    def __init__(self, entity_id: str):
        self.entity_id = entity_id
        # Lazily created per platform on first use.
        self._apis: Dict[ContentPlatform, Any] = {}
 
    def _get_api(self, platform: ContentPlatform):
        if platform not in self._apis:
            if platform == ContentPlatform.INSTAGRAM:
                self._apis[platform] = InstagramAPI(entity_id=self.entity_id)
            elif platform == ContentPlatform.TWITTER:
                self._apis[platform] = TwitterAPI(entity_id=self.entity_id)
            elif platform == ContentPlatform.FACEBOOK:
                self._apis[platform] = FacebookAPI(entity_id=self.entity_id)
            else:
                raise ValueError(f"Unsupported platform for publishing: {platform}")
        return self._apis[platform]
 
    async def _publish_one(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Publish a single item. `item` keys: platform, caption, hashtags, image_url, link."""
        platform = item["platform"]
        caption = item.get("caption", "")
        hashtags = item.get("hashtags") or []
        image_url = item.get("image_url")
        link = item.get("link")
 
        base = {"platform": platform, "successful": False, "post_id": None,
                "post_url": None, "error": None, "auth_required": False}
 
        if platform not in SUPPORTED_PLATFORMS:
            base["error"] = (f"Platform '{getattr(platform, 'value', platform)}' is not supported by the "
                             f"text/image publisher. Supported: instagram, twitter, facebook.")
            return base
 
        text = _compose_text(caption, hashtags, link)
 
        try:
            api = self._get_api(platform)
 
            if platform == ContentPlatform.INSTAGRAM:
                if not image_url:
                    base["error"] = "Instagram requires an image_url."
                    return base
                result = await api.post_image(image_url=image_url, caption=text)
 
            elif platform == ContentPlatform.TWITTER:
                # Twitter API here supports text posts; image is noted but not attached.
                result = await api.post_tweet(text=text)
 
            elif platform == ContentPlatform.FACEBOOK:
                result = await api.post_to_page(message=text, image_url=image_url)
 
            base["successful"] = bool(result.get("successful"))
            base["post_id"] = result.get("post_id")
            base["post_url"] = result.get("post_url")
            base["error"] = result.get("error")
            return base
 
        except ComposioAuthRequired as e:
            base["auth_required"] = True
            base["error"] = f"Authentication required for {getattr(platform,'value',platform)}: {getattr(e, 'auth_url', '')}"
            return base
        except Exception as e:  # noqa: BLE001
            logger.error(f"Publish to {platform} failed: {e}")
            base["error"] = str(e)
            return base
 
    async def publish(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Publish a list of per-platform items concurrently and aggregate the results."""
        results = await asyncio.gather(*[self._publish_one(i) for i in items])
        succeeded = sum(1 for r in results if r["successful"])
        failed = len(results) - succeeded
        return {
            "success": succeeded > 0,
            "total": len(results),
            "succeeded": succeeded,
            "failed": failed,
            "results": results,
        }
 