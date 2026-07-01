# tests/unit/test_wordpress_api.py
 
import types
import pytest
from unittest.mock import AsyncMock
 
from src.infrastructure.apis.wordpress_api import WordPressAPI
 
 
def _action(name):
    return types.SimpleNamespace(name=name)
 
 
@pytest.mark.asyncio
async def test_create_post_success():
    api = WordPressAPI(entity_id="e1")
    api._ensure_authentication = AsyncMock(return_value=None)
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[
        _action("WORDPRESS_CREATE_POST"),
    ])
    api.composio_executor.execute_action = AsyncMock(return_value={
        "successful": True,
        "data": {"id": 42, "link": "https://toriavey.com/?p=42"},
    })
 
    result = await api.create_post(title="Latkes", content="<p>Recipe</p>", status="draft")
 
    assert result["successful"] is True
    assert result["post_id"] == 42
    assert result["post_url"] == "https://toriavey.com/?p=42"
 
 
@pytest.mark.asyncio
async def test_create_post_action_missing():
    api = WordPressAPI(entity_id="e1")
    api._ensure_authentication = AsyncMock(return_value=None)
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[_action("WORDPRESS_LIST_POSTS")])
 
    result = await api.create_post(title="X", content="Y")
 
    assert result["successful"] is False
    assert "create-post action" in result["error"]
 
 
@pytest.mark.asyncio
async def test_create_post_passes_expected_params():
    api = WordPressAPI(entity_id="e1")
    api._ensure_authentication = AsyncMock(return_value=None)
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[_action("WORDPRESS_CREATE_POST")])
    exec_mock = AsyncMock(return_value={"successful": True, "data": {"id": 1}})
    api.composio_executor.execute_action = exec_mock
 
    await api.create_post(title="T", content="C", status="publish", excerpt="E")
 
    _, kwargs = exec_mock.call_args
    params = kwargs["params"]
    assert params["title"] == "T"
    assert params["content"] == "C"
    assert params["status"] == "publish"
    assert params["excerpt"] == "E"
 
 
@pytest.mark.asyncio
async def test_get_available_actions():
    api = WordPressAPI(entity_id="e1")
    api.composio_executor.get_actions_for_app = AsyncMock(return_value=[
        _action("WORDPRESS_CREATE_POST"), _action("WORDPRESS_LIST_POSTS"),
    ])
    result = await api.get_available_actions()
    assert result["successful"] is True
    assert result["count"] == 2
    assert "WORDPRESS_CREATE_POST" in result["actions"]
 