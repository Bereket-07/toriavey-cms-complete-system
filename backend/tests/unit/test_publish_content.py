# tests/unit/test_publish_content.py
 
import pytest
from unittest.mock import AsyncMock, patch
 
from src.use_cases.publish_content import PublishContentUseCase, _compose_text
from src.domain.models.content_model import ContentPlatform
 
 
def _ok(post_id="123", url="https://x/123"):
    return {"successful": True, "post_id": post_id, "post_url": url, "error": None}
 
 
class TestComposeText:
    def test_combines_caption_hashtags_link(self):
        text = _compose_text("Hello", ["food", "recipe"], "https://toriavey.com/x")
        assert "Hello" in text
        assert "#food" in text and "#recipe" in text
        assert "https://toriavey.com/x" in text
 
    def test_strips_leading_hash_and_handles_empty(self):
        assert _compose_text("Hi", ["#already"], None) == "Hi\n\n#already"
        assert _compose_text("Hi", [], None) == "Hi"
 
 
class TestPublishContentUseCase:
    @pytest.mark.asyncio
    async def test_publishes_to_all_three_platforms(self):
        uc = PublishContentUseCase(entity_id="e1")
        items = [
            {"platform": ContentPlatform.INSTAGRAM, "caption": "IG", "hashtags": ["a"], "image_url": "https://img/1.jpg"},
            {"platform": ContentPlatform.TWITTER, "caption": "TW", "hashtags": ["b"], "image_url": None},
            {"platform": ContentPlatform.FACEBOOK, "caption": "FB", "hashtags": ["c"], "image_url": "https://img/2.jpg"},
        ]
        with patch("src.infrastructure.apis.instagram_api.InstagramAPI.post_image", new_callable=AsyncMock, return_value=_ok("ig1")), \
             patch("src.infrastructure.apis.twitter_api.TwitterAPI.post_tweet", new_callable=AsyncMock, return_value=_ok("tw1")), \
             patch("src.infrastructure.apis.facebook_api.FacebookAPI.post_to_page", new_callable=AsyncMock, return_value=_ok("fb1")):
            result = await uc.publish(items)
 
        assert result["success"] is True
        assert result["total"] == 3
        assert result["succeeded"] == 3
        assert result["failed"] == 0
        platforms = {r["platform"] for r in result["results"]}
        assert platforms == {ContentPlatform.INSTAGRAM, ContentPlatform.TWITTER, ContentPlatform.FACEBOOK}
 
    @pytest.mark.asyncio
    async def test_instagram_without_image_fails_cleanly(self):
        uc = PublishContentUseCase(entity_id="e1")
        items = [{"platform": ContentPlatform.INSTAGRAM, "caption": "no image", "hashtags": [], "image_url": None}]
        result = await uc.publish(items)
        assert result["success"] is False
        assert result["results"][0]["successful"] is False
        assert "image_url" in result["results"][0]["error"]
 
    @pytest.mark.asyncio
    async def test_unsupported_platform_is_reported_not_raised(self):
        uc = PublishContentUseCase(entity_id="e1")
        items = [{"platform": ContentPlatform.PINTEREST, "caption": "x", "hashtags": [], "image_url": None}]
        result = await uc.publish(items)
        assert result["success"] is False
        assert "not supported" in result["results"][0]["error"].lower()
 
    @pytest.mark.asyncio
    async def test_partial_failure_aggregates_correctly(self):
        uc = PublishContentUseCase(entity_id="e1")
        items = [
            {"platform": ContentPlatform.TWITTER, "caption": "ok", "hashtags": [], "image_url": None},
            {"platform": ContentPlatform.FACEBOOK, "caption": "bad", "hashtags": [], "image_url": None},
        ]
        with patch("src.infrastructure.apis.twitter_api.TwitterAPI.post_tweet", new_callable=AsyncMock, return_value=_ok("tw1")), \
             patch("src.infrastructure.apis.facebook_api.FacebookAPI.post_to_page", new_callable=AsyncMock,
                   return_value={"successful": False, "post_id": None, "post_url": None, "error": "boom"}):
            result = await uc.publish(items)
 
        assert result["success"] is True   # at least one succeeded
        assert result["succeeded"] == 1
        assert result["failed"] == 1
 