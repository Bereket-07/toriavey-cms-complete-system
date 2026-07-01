# tests/unit/test_twitter_media.py
 
import types
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
 
from src.infrastructure.apis.twitter_api import TwitterAPI
 
 
def _action(name):
    return types.SimpleNamespace(name=name)
 
 
@pytest.mark.asyncio
async def test_post_tweet_with_media_success():
    api = TwitterAPI(entity_id="e1")
    api._ensure_authentication = AsyncMock(return_value=None)
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[
        _action("TWITTER_MEDIA_UPLOAD"),
        _action("TWITTER_CREATION_OF_A_POST"),
    ])
    api.composio_executor.execute_action = AsyncMock(side_effect=[
        {"successful": True, "data": {"media_id_string": "media-123"}},          # upload
        {"successful": True, "data": {"id": "tweet-999"}},                        # create post
    ])
 
    with patch("src.infrastructure.apis.twitter_api.requests.get") as mock_get:
        mock_get.return_value = MagicMock(content=b"\x89PNG fake", raise_for_status=lambda: None)
        result = await api.post_tweet_with_media(text="hi", media_url="https://img/x.jpg")
 
    assert result["successful"] is True
    assert result["tweet_id"] == "tweet-999"
    assert "tweet-999" in result["tweet_url"]
 
 
@pytest.mark.asyncio
async def test_post_tweet_with_media_no_media_id_errors():
    api = TwitterAPI(entity_id="e1")
    api._ensure_authentication = AsyncMock(return_value=None)
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[_action("TWITTER_MEDIA_UPLOAD")])
    api.composio_executor.execute_action = AsyncMock(return_value={"successful": True, "data": {}})
 
    with patch("src.infrastructure.apis.twitter_api.requests.get") as mock_get:
        mock_get.return_value = MagicMock(content=b"x", raise_for_status=lambda: None)
        result = await api.post_tweet_with_media(text="hi", media_url="https://img/x.jpg")
 
    assert result["successful"] is False
    assert "media_id" in result["error"]
 
 
@pytest.mark.asyncio
async def test_post_tweet_with_media_upload_action_missing():
    api = TwitterAPI(entity_id="e1")
    api._ensure_authentication = AsyncMock(return_value=None)
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[_action("TWITTER_CREATION_OF_A_POST")])
 
    with patch("src.infrastructure.apis.twitter_api.requests.get") as mock_get:
        mock_get.return_value = MagicMock(content=b"x", raise_for_status=lambda: None)
        result = await api.post_tweet_with_media(text="hi", media_url="https://img/x.jpg")
 
    assert result["successful"] is False
    assert "media-upload action" in result["error"]
 