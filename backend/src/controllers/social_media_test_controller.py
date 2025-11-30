# src/controllers/social_media_test_controller.py

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from src.infrastructure.apis.instagram_api import InstagramAPI
from src.infrastructure.apis.twitter_api import TwitterAPI
from src.infrastructure.apis.composio import ComposioAuthRequired, ComposioApiKeyRequired

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/test", tags=["Social Media Testing"])


# ============= REQUEST SCHEMAS =============

class InstagramTestPostRequest(BaseModel):
    """Request to test Instagram posting"""
    image_url: str
    caption: str
    entity_id: str = "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"  # Default test entity


class TwitterTestPostRequest(BaseModel):
    """Request to test Twitter posting"""
    text: str
    media_url: Optional[str] = None
    entity_id: str = "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"  # Default test entity


# ============= TEST ENDPOINTS =============

@router.post("/instagram-auth")
async def test_instagram_auth(entity_id: str = "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"):
    """
    Test Instagram OAuth2 authentication status.
    
    Returns authentication status and available actions.
    """
    try:
        instagram_api = InstagramAPI(entity_id=entity_id)
        
        # Try to ensure authentication
        try:
            await instagram_api._ensure_authentication()
            auth_status = "authenticated"
            auth_message = "Instagram is authenticated and ready to use"
        except ComposioAuthRequired as e:
            auth_status = "auth_required"
            auth_message = f"OAuth2 authentication required. Please visit: {e.auth_url}"
            return {
                "success": False,
                "auth_status": auth_status,
                "message": auth_message,
                "auth_url": e.auth_url,
                "app_name": e.app_name
            }
        
        # Get available actions
        actions_result = await instagram_api.get_available_actions()
        
        return {
            "success": True,
            "auth_status": auth_status,
            "message": auth_message,
            "entity_id": entity_id,
            "available_actions": actions_result.get("actions", []),
            "actions_count": actions_result.get("count", 0)
        }
        
    except Exception as e:
        logger.error(f"Instagram auth test failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/twitter-auth")
async def test_twitter_auth(entity_id: str = "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"):
    """
    Test Twitter OAuth2 authentication status.
    
    Returns authentication status and available actions.
    """
    try:
        twitter_api = TwitterAPI(entity_id=entity_id)
        
        # Try to ensure authentication
        try:
            await twitter_api._ensure_authentication()
            auth_status = "authenticated"
            auth_message = "Twitter is authenticated and ready to use"
        except ComposioAuthRequired as e:
            auth_status = "auth_required"
            auth_message = f"OAuth2 authentication required. Please visit: {e.auth_url}"
            return {
                "success": False,
                "auth_status": auth_status,
                "message": auth_message,
                "auth_url": e.auth_url,
                "app_name": e.app_name
            }
        
        # Get available actions
        actions_result = await twitter_api.get_available_actions()
        
        return {
            "success": True,
            "auth_status": auth_status,
            "message": auth_message,
            "entity_id": entity_id,
            "available_actions": actions_result.get("actions", []),
            "actions_count": actions_result.get("count", 0)
        }
        
    except Exception as e:
        logger.error(f"Twitter auth test failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/instagram-post")
async def test_instagram_post(request: InstagramTestPostRequest):
    """
    Test posting an image to Instagram.
    
    **Example Request:**
    ```json
    {
      "image_url": "https://example.com/test-image.jpg",
      "caption": "Test post from Tori Avey CMS! 🍰 #recipe #food",
      "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"
    }
    ```
    """
    try:
        instagram_api = InstagramAPI(entity_id=request.entity_id)
        
        result = await instagram_api.post_image(
            image_url=request.image_url,
            caption=request.caption
        )
        
        if result.get("successful"):
            return {
                "success": True,
                "message": "Successfully posted to Instagram",
                "post_id": result.get("post_id"),
                "data": result.get("data")
            }
        else:
            return {
                "success": False,
                "message": "Failed to post to Instagram",
                "error": result.get("error"),
                "data": result.get("data")
            }
            
    except ComposioAuthRequired as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Instagram OAuth2 authentication required",
                "auth_url": e.auth_url,
                "app_name": e.app_name
            }
        )
    except Exception as e:
        logger.error(f"Instagram post test failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/twitter-post")
async def test_twitter_post(request: TwitterTestPostRequest):
    """
    Test posting a tweet to Twitter.
    
    **Example Request (text only):**
    ```json
    {
      "text": "Test tweet from Tori Avey CMS! Check out our latest recipe 🍰 #recipe #food",
      "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"
    }
    ```
    
    **Example Request (with media):**
    ```json
    {
      "text": "Test tweet with image from Tori Avey CMS! 🍰 #recipe #food",
      "media_url": "https://example.com/test-image.jpg",
      "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"
    }
    ```
    """
    try:
        twitter_api = TwitterAPI(entity_id=request.entity_id)
        
        if request.media_url:
            result = await twitter_api.post_tweet_with_media(
                text=request.text,
                media_url=request.media_url,
                media_type="image"  # Will be auto-detected
            )
        else:
            result = await twitter_api.post_tweet(
                text=request.text
            )
        
        if result.get("successful"):
            return {
                "success": True,
                "message": "Successfully posted to Twitter",
                "tweet_id": result.get("tweet_id"),
                "tweet_url": result.get("tweet_url"),
                "data": result.get("data")
            }
        else:
            return {
                "success": False,
                "message": "Failed to post to Twitter",
                "error": result.get("error"),
                "data": result.get("data")
            }
            
    except ComposioAuthRequired as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Twitter OAuth2 authentication required",
                "auth_url": e.auth_url,
                "app_name": e.app_name
            }
        )
    except Exception as e:
        logger.error(f"Twitter post test failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check for social media test endpoints"""
    return {
        "status": "healthy",
        "service": "social_media_test_controller",
        "endpoints": [
            "POST /api/test/instagram-auth",
            "POST /api/test/twitter-auth",
            "POST /api/test/instagram-post",
            "POST /api/test/twitter-post"
        ]
    }
