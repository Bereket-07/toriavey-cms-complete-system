# src/controllers/content_controller.py

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from typing import List, Optional

from src.domain.schemas.content_schemas import (
    GenerateContentFromRecipeRequest,
    GenerateContentBatchRequest,
    EditContentRequest,
    ApproveContentRequest,
    RejectContentRequest,
    PostContentRequest,
    RegenerateContentRequest,
    GenerateContentResponse,
    GenerateBatchResponse,
    PendingContentsResponse,
    PostContentResponse,
    EditContentResponse,
    ContentWithRecipeResponse,
    ContentStatsResponse
)
from src.use_cases.generate_content import GenerateContentUseCase
from src.use_cases.manage_content import ManageContentUseCase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/content", tags=["Content Management"])


# ============= CONTENT GENERATION ENDPOINTS =============

@router.post("/generate", response_model=GenerateContentResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_content_from_recipe(
    request: GenerateContentFromRecipeRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate social media content from a recipe URL.
    
    **Workflow:**
    1. Scrapes recipe data from the provided URL
    2. Uses LLM (Gemini) to generate platform-optimized content
    3. Creates engaging captions with hashtags for each platform
    4. Content appears in pending dashboard for review
    
    **Supported Platforms:**
    - Instagram
    - Twitter/X
    - Threads
    - Facebook
    - LinkedIn
    - Pinterest
    """
    try:
        logger.info(f"Generating content for {len(request.target_platforms)} platforms")
        
        use_case = GenerateContentUseCase()
        
        # Generate content in background
        result = await use_case.generate_from_recipe_url(
            recipe_url=str(request.recipe_url),
            target_platforms=request.target_platforms,
            tone=request.tone,
            include_emojis=request.include_emojis,
            max_hashtags=request.max_hashtags,
            custom_instructions=request.custom_instructions
        )
        
        # TODO: Save to database
        
        # Extract successful generations
        successful_contents = [
            c for c in result["generated_contents"] 
            if "error" not in c
        ]
        
        return GenerateContentResponse(
            success=len(successful_contents) > 0,
            message=f"Generated content for {len(successful_contents)} platform(s)",
            generated_contents=[],  # TODO: Map to response schema
            recipe=None,  # TODO: Map recipe data
            total_generated=len(successful_contents)
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to generate content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}"
        )


@router.post("/generate-batch", response_model=GenerateBatchResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_content_batch(
    request: GenerateContentBatchRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate content from multiple recipe URLs in batch.
    
    Useful for bulk content creation from a list of recipes.
    Processing happens in the background.
    """
    try:
        logger.info(f"Starting batch generation for {len(request.recipe_urls)} recipes")
        
        # TODO: Create batch record in database
        batch_id = 1  # Placeholder
        
        # Process in background
        # background_tasks.add_task(process_batch, ...)
        
        return GenerateBatchResponse(
            success=True,
            message=f"Batch processing started for {len(request.recipe_urls)} recipes",
            batch_id=batch_id,
            batch_name=request.batch_name or f"Batch {batch_id}",
            total_items=len(request.recipe_urls),
            processed_items=0,
            successful_items=0,
            failed_items=0,
            status="processing"
        )
        
    except Exception as e:
        logger.error(f"Failed to start batch generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= CONTENT REVIEW ENDPOINTS =============

@router.get("/pending", response_model=PendingContentsResponse)
async def get_pending_content():
    """
    Get all pending content awaiting approval/rejection.
    
    Returns content grouped by recipe with platform-specific variations.
    """
    try:
        # TODO: Fetch from database
        mock_contents = []
        
        return PendingContentsResponse(
            total_pending=len(mock_contents),
            contents=mock_contents
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch pending content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/content/{content_id}", response_model=ContentWithRecipeResponse)
async def get_content_details(content_id: int):
    """
    Get detailed information about specific content including recipe data.
    """
    try:
        # TODO: Fetch from database
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content {content_id} not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch content {content_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats", response_model=ContentStatsResponse)
async def get_content_stats():
    """
    Get statistics about generated and posted content.
    """
    try:
        # TODO: Fetch from database
        return ContentStatsResponse(
            total_generated=0,
            pending=0,
            approved=0,
            rejected=0,
            posted=0,
            by_platform={},
            by_status={},
            recent_posts=[]
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= CONTENT EDITING ENDPOINTS =============

@router.post("/edit", response_model=EditContentResponse)
async def edit_content(request: EditContentRequest):
    """
    Edit generated content (caption, hashtags, image).
    
    Allows manual refinement of AI-generated content before posting.
    Tracks edit history.
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageContentUseCase(entity_id=entity_id)
        
        result = await use_case.edit_content(
            content_id=request.content_id,
            caption=request.caption,
            hashtags=request.hashtags,
            image_url=request.image_url,
            edited_by=request.edited_by
        )
        
        # TODO: Fetch updated content from database
        return EditContentResponse(
            success=result["success"],
            message="Content updated successfully",
            content=None  # TODO: Map to response schema
        )
        
    except Exception as e:
        logger.error(f"Failed to edit content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/regenerate")
async def regenerate_content(request: RegenerateContentRequest):
    """
    Regenerate content with different parameters.
    
    Useful when the initial generation doesn't meet expectations.
    Creates a new version while keeping the original.
    """
    try:
        # TODO: Fetch original content and recipe from database
        # TODO: Call GenerateContentUseCase.regenerate_content()
        
        return {
            "success": True,
            "message": "Content regenerated successfully",
            "new_content_id": None  # TODO: Return new content ID
        }
        
    except Exception as e:
        logger.error(f"Failed to regenerate content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= APPROVAL/REJECTION ENDPOINTS =============

@router.post("/approve")
async def approve_content(request: ApproveContentRequest):
    """
    Approve content for posting.
    
    Once approved, content can be posted to social media platforms.
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageContentUseCase(entity_id=entity_id)
        
        result = await use_case.approve_content(
            content_id=request.content_id,
            approved_by=request.approved_by
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to approve content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/reject")
async def reject_content(request: RejectContentRequest):
    """
    Reject content.
    
    Rejected content will not be posted and can be filtered out of the dashboard.
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageContentUseCase(entity_id=entity_id)
        
        result = await use_case.reject_content(
            content_id=request.content_id,
            rejection_reason=request.rejection_reason,
            rejected_by=request.rejected_by
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to reject content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/bulk-approve")
async def bulk_approve_content(content_ids: List[int], approved_by: Optional[int] = None):
    """
    Approve multiple contents at once.
    """
    try:
        entity_id = "default_user"
        use_case = ManageContentUseCase(entity_id=entity_id)
        
        result = await use_case.bulk_approve(
            content_ids=content_ids,
            approved_by=approved_by
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to bulk approve: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= POSTING ENDPOINTS =============

@router.post("/post", response_model=PostContentResponse)
async def post_content_to_social_media(request: PostContentRequest):
    """
    Post approved content to social media platforms.
    
    **Requirements:**
    - Content must be approved
    - Valid authentication for each platform
    - Image must be accessible if included
    
    **Supported Platforms:**
    - Instagram (coming soon)
    - Twitter/X (coming soon)
    - Threads (coming soon)
    - Facebook (coming soon)
    - LinkedIn (coming soon)
    - Pinterest (coming soon)
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageContentUseCase(entity_id=entity_id)
        
        # TODO: Fetch content data from database and verify it's approved
        content_data = {
            "id": request.content_id,
            "caption": "Sample caption",
            "hashtags": "#food #recipe",
            "image_url": "https://example.com/image.jpg"
        }
        
        # Use content's target platform if platforms not specified
        platforms = request.platforms or []  # TODO: Get from content
        
        results = await use_case.post_content_to_platforms(
            content_data=content_data,
            platforms=platforms,
            schedule_for=request.schedule_for
        )
        
        return PostContentResponse(
            success=len(results.get("posted_platforms", [])) > 0,
            message=f"Posted to {len(results.get('posted_platforms', []))} platform(s)",
            content_id=request.content_id,
            posted_platforms=results.get("posted_platforms", []),
            failed_platforms=results.get("failed_platforms", []),
            scheduled_for=request.schedule_for
        )
        
    except Exception as e:
        logger.error(f"Failed to post content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/bulk-post")
async def bulk_post_content(
    content_ids: List[int],
    platforms: List[str],
    posted_by: Optional[int] = None
):
    """
    Post multiple approved contents to platforms at once.
    """
    try:
        from src.domain.models.content_model import ContentPlatform
        
        entity_id = "default_user"
        use_case = ManageContentUseCase(entity_id=entity_id)
        
        platform_enums = [ContentPlatform(p) for p in platforms]
        
        result = await use_case.bulk_post(
            content_ids=content_ids,
            platforms=platform_enums,
            posted_by=posted_by
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to bulk post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the content service"""
    return {
        "status": "healthy",
        "service": "content_controller",
        "endpoints": [
            "POST /api/content/generate",
            "POST /api/content/generate-batch",
            "GET /api/content/pending",
            "GET /api/content/content/{content_id}",
            "GET /api/content/stats",
            "POST /api/content/edit",
            "POST /api/content/regenerate",
            "POST /api/content/approve",
            "POST /api/content/reject",
            "POST /api/content/bulk-approve",
            "POST /api/content/post",
            "POST /api/content/bulk-post"
        ]
    }
