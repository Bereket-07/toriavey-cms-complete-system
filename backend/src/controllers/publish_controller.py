# src/controllers/publish_controller.py
 
import logging
 
from fastapi import APIRouter, HTTPException, status
 
from src.domain.schemas.publish_schemas import (
    PublishRequest, PublishResponse, PublishResult,
)
from src.use_cases.publish_content import PublishContentUseCase
 
logger = logging.getLogger(__name__)
 
router = APIRouter(prefix="/api/publish", tags=["Publishing"])
 
 
@router.post("", response_model=PublishResponse)
async def publish_content(request: PublishRequest):
    """
    Publish generated content to one or more platforms (Instagram, Twitter/X, Facebook).
 
    Routes each item to the correct platform API and returns a per-platform result.
    A 200 is returned even on partial failure; inspect `results` for per-platform status.
    """
    try:
        use_case = PublishContentUseCase(entity_id=request.entity_id)
        items = [
            {
                "platform": item.platform,
                "caption": item.caption,
                "hashtags": item.hashtags,
                "image_url": item.image_url,
                "link": item.link,
            }
            for item in request.items
        ]
        result = await use_case.publish(items)
        return PublishResponse(
            success=result["success"],
            total=result["total"],
            succeeded=result["succeeded"],
            failed=result["failed"],
            results=[PublishResult(**r) for r in result["results"]],
        )
    except Exception as e:
        logger.error(f"Publish request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
 