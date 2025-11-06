# src/controllers/content_controller.py

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from typing import List, Optional
from pydantic import BaseModel

from src.domain.schemas.content_schemas import (
    GenerateContentFromRecipeRequest,
    GenerateContentBatchRequest,
    SelectAlternativeCaptionRequest,
    EditContentRequest,
    ApproveContentRequest,
    RejectContentRequest,
    PostContentRequest,
    RegenerateContentRequest,
    SimpleGenerateContentResponse,
    GenerateContentResponse,
    GenerateBatchResponse,
    SelectCaptionResponse,
    PendingContentsResponse,
    PostContentResponse,
    EditContentResponse,
    ContentWithRecipeResponse,
    ContentStatsResponse,
    ContentPlatform
)
from src.use_cases.generate_content import GenerateContentUseCase
from src.use_cases.manage_content import ManageContentUseCase
from src.infrastructure.repository.recipe_repo import RecipeRepository
from src.infrastructure.repository.wprm_recipe_repo import WPRMRecipeRepository
from src.infrastructure.repository.wprm_content_status_repo import WPRMContentStatusRepository
from src.domain.models.wprm_content_status_model import ContentStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/content", tags=["Content Management"])


# ============= REQUEST/RESPONSE SCHEMAS FOR NEW ENDPOINTS =============

class BatchGenerateFromUnprocessedRequest(BaseModel):
    """Request to generate content from unprocessed recipes"""
    target_platforms: List[ContentPlatform]
    limit: Optional[int] = None
    tone: str = "engaging and friendly"
    include_emojis: bool = True
    max_hashtags: int = 10


class BatchGenerateFromUnprocessedResponse(BaseModel):
    """Response from batch generation"""
    success: bool
    message: str
    total_recipes: int
    processed: int
    successful: int
    failed: int
    results: List[dict]


class ContentGenerationStatsResponse(BaseModel):
    """Statistics about content generation status"""
    total_recipes: int
    content_generated: int
    pending_generation: int
    completion_percentage: float


# ============= CONTENT GENERATION ENDPOINTS =============

@router.post("/generate", response_model=SimpleGenerateContentResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_content_from_recipe(
    request: GenerateContentFromRecipeRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate social media content from recipe data (from database).
    
    **Workflow:**
    1. Receives recipe data from your database
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
    
    **Example Request:**
    ```json
    {
      "recipe_id": 123,
      "recipe_data": {
        "title": "Classic Chocolate Chip Cookies",
        "description": "The best chocolate chip cookies...",
        "ingredients": ["2 cups flour", "1 cup butter", "..."],
        "instructions": ["Preheat oven to 350°F", "Mix ingredients", "..."],
        "prep_time": "15 minutes",
        "cook_time": "12 minutes",
        "servings": "24 cookies",
        "cuisine": "American",
        "image_url": "https://example.com/image.jpg"
      },
      "target_platforms": ["instagram", "twitter", "threads"],
      "tone": "warm and inviting",
      "include_emojis": true,
      "max_hashtags": 10
    }
    ```
    """
    try:
        logger.info(f"Generating content for {len(request.target_platforms)} platforms from recipe: {request.recipe_data.title}")
        
        use_case = GenerateContentUseCase()
        
        # Convert RecipeDataInput to dict
        recipe_dict = request.recipe_data.model_dump()
        
        # Generate content
        result = await use_case.generate_from_recipe_data(
            recipe_data=recipe_dict,
            target_platforms=request.target_platforms,
            tone=request.tone,
            include_emojis=request.include_emojis,
            max_hashtags=request.max_hashtags,
            custom_instructions=request.custom_instructions
        )
        
        # TODO: Save to database with recipe_id if provided
        
        # Extract successful generations
        successful_contents = [
            c for c in result["generated_contents"] 
            if "error" not in c
        ]
        
        # Map generated contents to response format
        mapped_contents = []
        for content_item in successful_contents:
            mapped_contents.append({
                "platform": content_item["platform"].value,
                "caption": content_item["content"].caption,
                "hashtags": content_item["content"].hashtags,
                "platform_specific": content_item["content"].platform_specific,
                "image_suggestions": getattr(content_item["content"], "image_suggestions", []),
                "alternative_captions": getattr(content_item["content"], "alternative_captions", []),
                "selected_caption_index": 0  # Default to main caption
            })
        
        # Map recipe data
        recipe_response = {
            "title": result["recipe"].title,
            "description": result["recipe"].description,
            "url": result["recipe"].url,
            "image_url": result["recipe"].image_url,
            "cuisine": result["recipe"].cuisine,
            "prep_time": result["recipe"].prep_time,
            "cook_time": result["recipe"].cook_time,
            "servings": result["recipe"].servings
        }
        
        return SimpleGenerateContentResponse(
            success=len(successful_contents) > 0,
            message=f"Generated content for {len(successful_contents)} platform(s)",
            generated_contents=mapped_contents,
            recipe=recipe_response,
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


@router.post("/select-caption", response_model=SimpleGenerateContentResponse, status_code=status.HTTP_200_OK)
async def select_alternative_caption(
    request: SelectAlternativeCaptionRequest,
    generated_content: SimpleGenerateContentResponse
):
    """
    Select an alternative caption from the generated content.
    
    This endpoint allows you to switch between the main caption and alternative captions.
    
    **How it works:**
    1. After generating content, you get a main caption and alternative_captions list
    2. Use this endpoint to select which caption to use
    3. caption_index: 0 = main caption, 1 = first alternative, 2 = second alternative, etc.
    
    **Example Request:**
    ```json
    {
      "platform": "instagram",
      "caption_index": 1
    }
    ```
    
    **Response:**
    Returns the updated content with the selected caption as the main caption.
    """
    try:
        logger.info(f"Selecting caption index {request.caption_index} for platform {request.platform}")
        
        # Find the content for the specified platform
        platform_content = None
        for content in generated_content.generated_contents:
            if content["platform"] == request.platform.value:
                platform_content = content
                break
        
        if not platform_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content for platform '{request.platform.value}' not found"
            )
        
        # Get all available captions (main + alternatives)
        all_captions = [platform_content["caption"]] + platform_content.get("alternative_captions", [])
        
        # Validate caption index
        if request.caption_index >= len(all_captions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Caption index {request.caption_index} out of range. Available: 0-{len(all_captions)-1}"
            )
        
        # Select the caption
        selected_caption = all_captions[request.caption_index]
        
        # Update the content
        platform_content["caption"] = selected_caption
        platform_content["selected_caption_index"] = request.caption_index
        
        logger.info(f"Caption selected successfully for {request.platform.value}")
        
        return generated_content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to select caption: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to select caption: {str(e)}"
        )


@router.post("/generate-batch", response_model=GenerateBatchResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_content_batch(
    request: GenerateContentBatchRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate content from multiple recipes in batch (using recipe IDs from database).
    
    Useful for bulk content creation from a list of recipes.
    Processing happens in the background.
    
    **Example Request:**
    ```json
    {
      "recipe_ids": [123, 456, 789],
      "target_platforms": ["instagram", "twitter"],
      "batch_name": "Weekly Recipe Posts",
      "tone": "engaging and friendly",
      "include_emojis": true,
      "max_hashtags": 10
    }
    ```
    
    **Note:** You need to fetch recipe data from your database using these IDs
    and call the /generate endpoint for each recipe.
    """
    try:
        logger.info(f"Starting batch generation for {len(request.recipe_ids)} recipes")
        
        # TODO: Create batch record in database
        batch_id = 1  # Placeholder
        
        # TODO: Fetch recipes from database using recipe_ids
        # TODO: Process each recipe in background
        # background_tasks.add_task(process_batch, ...)
        
        return GenerateBatchResponse(
            success=True,
            message=f"Batch processing started for {len(request.recipe_ids)} recipes",
            batch_id=batch_id,
            batch_name=request.batch_name or f"Batch {batch_id}",
            total_items=len(request.recipe_ids),
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
            "POST /api/content/generate-from-unprocessed",
            "GET /api/content/generation-stats",
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


# ============= BATCH GENERATION FROM UNPROCESSED RECIPES =============
# NOTE: This functionality is now handled by the WPRM Scheduler
# Use /api/wprm-scheduler/run-now or /api/wprm-scheduler/generate-batch instead


@router.get("/generation-stats", response_model=ContentGenerationStatsResponse)
async def get_content_generation_stats():
    """
    Get statistics about content generation status for recipes.
    
    Returns:
    - Total number of recipes in database
    - Number of recipes with content generated
    - Number of recipes pending content generation
    - Completion percentage
    
    **Example Response:**
    ```json
    {
      "total_recipes": 150,
      "content_generated": 100,
      "pending_generation": 50,
      "completion_percentage": 66.67
    }
    ```
    """
    try:
        repo = RecipeRepository()
        stats = repo.get_content_generation_stats()
        
        return ContentGenerationStatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Failed to fetch generation stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/unprocessed-recipes")
async def get_unprocessed_recipes(limit: int = 10):
    """
    Get a list of unprocessed recipes (content not yet generated)
    
    Args:
        limit: Maximum number of recipes to return (default: 10)
    
    Returns:
        List of unprocessed recipes with their details
    """
    try:
        recipe_repo = RecipeRepository()
        unprocessed = recipe_repo.fetch_unprocessed_recipes(limit=limit)
        
        return {
            "success": True,
            "total_unprocessed": len(unprocessed),
            "limit": limit,
            "recipes": unprocessed
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch unprocessed recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/all-recipes")
async def get_all_recipes(limit: int = 20, offset: int = 0):
    """
    Get ALL recipes from the database (processed and unprocessed)
    
    Args:
        limit: Maximum number of recipes to return (default: 20)
        offset: Number of recipes to skip (for pagination, default: 0)
    
    Returns:
        List of all recipes with their details and total count
    """
    try:
        recipe_repo = RecipeRepository()
        all_recipes = recipe_repo.fetch_all()
        
        # Get total count
        total_count = len(all_recipes)
        
        # Apply pagination
        paginated_recipes = all_recipes[offset:offset + limit]
        
        return {
            "success": True,
            "total_recipes": total_count,
            "limit": limit,
            "offset": offset,
            "returned": len(paginated_recipes),
            "recipes": paginated_recipes
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch all recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/recipes-count")
async def get_recipes_count():
    """
    Get total count of recipes in the database
    
    Returns:
        Total number of recipes, processed count, and unprocessed count
    """
    try:
        recipe_repo = RecipeRepository()
        stats = recipe_repo.get_content_generation_stats()
        
        return {
            "success": True,
            "total_recipes": stats["total_recipes"],
            "content_generated": stats["content_generated"],
            "pending_generation": stats["pending_generation"],
            "completion_percentage": stats["completion_percentage"]
        }
        
    except Exception as e:
        logger.error(f"Failed to get recipes count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes")
async def get_wprm_recipes(limit: int = 20, offset: int = 0):
    """
    Get WordPress Recipe Maker (WPRM) recipes from wp_tori_posts
    
    This accesses the actual recipe database with 763+ recipes!
    
    Args:
        limit: Maximum number of recipes to return (default: 20)
        offset: Number of recipes to skip (for pagination, default: 0)
    
    Returns:
        List of WPRM recipes with full metadata, ingredients, instructions, and images
    """
    try:
        wprm_repo = WPRMRecipeRepository()
        result = wprm_repo.get_all_recipes(limit=limit, offset=offset)
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch WPRM recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes/{recipe_id}")
async def get_wprm_recipe_by_id(recipe_id: int):
    """
    Get a single WPRM recipe by ID
    
    Args:
        recipe_id: Recipe post ID
    
    Returns:
        Complete recipe data with metadata, ingredients, instructions, and images
    """
    try:
        wprm_repo = WPRMRecipeRepository()
        recipe = wprm_repo.get_recipe_by_id(recipe_id)
        
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recipe with ID {recipe_id} not found"
            )
        
        return {
            "success": True,
            "recipe": recipe
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch WPRM recipe {recipe_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes-count")
async def get_wprm_recipes_count():
    """
    Get total count of WPRM recipes
    
    Returns:
        Total number of published WPRM recipes
    """
    try:
        wprm_repo = WPRMRecipeRepository()
        count = wprm_repo.get_recipe_count()
        
        return {
            "success": True,
            "total_recipes": count,
            "source": "wp_tori_posts (post_type='wprm_recipe')"
        }
        
    except Exception as e:
        logger.error(f"Failed to get WPRM recipes count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes/search/{query}")
async def search_wprm_recipes(query: str, limit: int = 20):
    """
    Search WPRM recipes by title
    
    Args:
        query: Search query
        limit: Maximum results (default: 20)
    
    Returns:
        List of matching recipes
    """
    try:
        wprm_repo = WPRMRecipeRepository()
        recipes = wprm_repo.search_recipes(query, limit)
        
        return {
            "success": True,
            "query": query,
            "total_found": len(recipes),
            "recipes": recipes
        }
        
    except Exception as e:
        logger.error(f"Failed to search WPRM recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= WPRM CONTENT STATUS ENDPOINTS =============

@router.get("/wprm-status-summary")
async def get_wprm_status_summary():
    """
    Get summary of WPRM content generation status
    
    Returns:
        Summary with counts for each status
    """
    try:
        status_repo = WPRMContentStatusRepository()
        summary = status_repo.get_status_summary()
        
        return {
            "success": True,
            **summary
        }
        
    except Exception as e:
        logger.error(f"Failed to get status summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes-not-generated")
async def get_wprm_recipes_not_generated(limit: int = None, offset: int = 0):
    """
    Get WPRM recipes that need content generation
    
    Includes recipes with status 'not_generated' or 'declined'
    
    Args:
        limit: Maximum number of recipes (default: None = all recipes)
        offset: Number to skip (default: 0)
    
    Returns:
        List of recipes needing content generation with full recipe data
    """
    try:
        status_repo = WPRMContentStatusRepository()
        wprm_repo = WPRMRecipeRepository()
        
        # Get recipes needing generation (use large limit if None)
        actual_limit = limit if limit is not None else 10000
        statuses = status_repo.get_not_generated_recipes(actual_limit, offset)
        
        # Get full recipe data
        recipes = []
        for status_obj in statuses:
            recipe = wprm_repo.get_recipe_by_id(status_obj.recipe_id)
            if recipe:
                recipe['content_status'] = {
                    'status': status_obj.status,
                    'content_generated': status_obj.content_generated,
                    'posted': status_obj.posted,
                    'retry_count': status_obj.retry_count,
                    'last_error': status_obj.last_error
                }
                recipes.append(recipe)
        
        return {
            "success": True,
            "total_needing_generation": len(statuses),
            "limit": limit,
            "offset": offset,
            "recipes": recipes
        }
        
    except Exception as e:
        logger.error(f"Failed to get recipes not generated: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes-generated-not-posted")
async def get_wprm_recipes_generated_not_posted(limit: int = None, offset: int = 0):
    """
    Get WPRM recipes with generated content that haven't been posted (status: generated)
    
    These recipes need approval before posting.
    
    Args:
        limit: Maximum number of recipes (default: None = all recipes)
        offset: Number to skip (default: 0)
    
    Returns:
        List of recipes with generated content waiting for approval
    """
    try:
        status_repo = WPRMContentStatusRepository()
        wprm_repo = WPRMRecipeRepository()
        
        # Get recipes with generated content (use large limit if None)
        actual_limit = limit if limit is not None else 10000
        statuses = status_repo.get_generated_not_posted_recipes(actual_limit, offset)
        
        # Get full recipe data with generated content
        recipes = []
        for status_obj in statuses:
            recipe = wprm_repo.get_recipe_by_id(status_obj.recipe_id)
            if recipe:
                recipe['content_status'] = {
                    'status': status_obj.status,
                    'content_generated': status_obj.content_generated,
                    'posted': status_obj.posted,
                    'generation_date': str(status_obj.generation_date) if status_obj.generation_date else None
                }
                recipe['generated_content'] = status_repo.get_generated_content(status_obj.recipe_id)
                recipes.append(recipe)
        
        return {
            "success": True,
            "total_awaiting_approval": len(statuses),
            "limit": limit,
            "offset": offset,
            "recipes": recipes
        }
        
    except Exception as e:
        logger.error(f"Failed to get generated not posted recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipes-pending")
async def get_wprm_recipes_pending(limit: int = None, offset: int = 0):
    """
    Get WPRM recipes with pending status (approved and waiting to be posted)
    
    These recipes are approved and ready to post to social media.
    
    Args:
        limit: Maximum number of recipes (default: None = all recipes)
        offset: Number to skip (default: 0)
    
    Returns:
        List of recipes ready to post
    """
    try:
        status_repo = WPRMContentStatusRepository()
        wprm_repo = WPRMRecipeRepository()
        
        # Get pending recipes
        actual_limit = limit if limit is not None else 10000
        statuses = status_repo.get_pending_recipes(actual_limit, offset)
        
        # Get full recipe data with generated content
        recipes = []
        for status_obj in statuses:
            recipe = wprm_repo.get_recipe_by_id(status_obj.recipe_id)
            if recipe:
                recipe['content_status'] = {
                    'status': status_obj.status,
                    'content_generated': status_obj.content_generated,
                    'posted': status_obj.posted,
                    'generation_date': str(status_obj.generation_date) if status_obj.generation_date else None
                }
                recipe['generated_content'] = status_repo.get_generated_content(status_obj.recipe_id)
                recipes.append(recipe)
        
        return {
            "success": True,
            "total_pending": len(statuses),
            "limit": limit,
            "offset": offset,
            "recipes": recipes
        }
        
    except Exception as e:
        logger.error(f"Failed to get pending recipes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/wprm-approve-content/{recipe_id}")
async def approve_wprm_content(recipe_id: int):
    """
    Approve generated content and mark as pending (ready to post)
    
    Args:
        recipe_id: Recipe post ID
    
    Returns:
        Updated recipe status
    """
    try:
        status_repo = WPRMContentStatusRepository()
        
        # Check if content is generated
        status_obj = status_repo.get_status_by_recipe_id(recipe_id)
        if not status_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recipe {recipe_id} not found in tracking"
            )
        
        if status_obj.status != 'generated':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Recipe {recipe_id} is not in 'generated' status. Current status: {status_obj.status}"
            )
        
        # Mark as pending
        status_repo.mark_as_pending(recipe_id)
        
        return {
            "success": True,
            "message": f"Recipe {recipe_id} approved and marked as pending",
            "recipe_id": recipe_id,
            "new_status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to approve content for recipe {recipe_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/wprm-decline-content/{recipe_id}")
async def decline_wprm_content(recipe_id: int, reason: str = None):
    """
    Decline generated content (will be regenerated later)
    
    Args:
        recipe_id: Recipe post ID
        reason: Optional reason for declining
    
    Returns:
        Updated recipe status
    """
    try:
        status_repo = WPRMContentStatusRepository()
        
        # Mark as declined
        status_repo.mark_as_declined(recipe_id, reason)
        
        return {
            "success": True,
            "message": f"Recipe {recipe_id} content declined",
            "recipe_id": recipe_id,
            "new_status": "declined",
            "reason": reason
        }
        
    except Exception as e:
        logger.error(f"Failed to decline content for recipe {recipe_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/wprm-reset-empty-content")
async def reset_empty_wprm_content():
    """
    Reset all recipes with empty/bad generated content back to not_generated status
    
    This will find all recipes marked as 'generated' but have empty content,
    and reset them so they can be regenerated properly.
    
    Returns:
        Count of recipes reset
    """
    try:
        status_repo = WPRMContentStatusRepository()
        
        # Get all generated recipes
        generated_recipes = status_repo.get_generated_not_posted_recipes(limit=10000, offset=0)
        
        reset_count = 0
        for status_obj in generated_recipes:
            # Check if content is empty or invalid
            if status_obj.generated_content:
                content = json.loads(status_obj.generated_content) if isinstance(status_obj.generated_content, str) else status_obj.generated_content
                
                # Check if all platforms have empty content
                is_empty = True
                for platform, platform_content in content.items():
                    if isinstance(platform_content, dict):
                        # Check for actual content (not just empty strings)
                        if platform_content.get('content') or platform_content.get('caption') or platform_content.get('post') or platform_content.get('tweet'):
                            is_empty = False
                            break
                
                if is_empty:
                    # Reset to not_generated
                    status_repo.reset_to_not_generated(status_obj.recipe_id)
                    reset_count += 1
                    logger.info(f"Reset recipe {status_obj.recipe_id} with empty content")
            else:
                # No content at all, reset
                status_repo.reset_to_not_generated(status_obj.recipe_id)
                reset_count += 1
                logger.info(f"Reset recipe {status_obj.recipe_id} with no content")
        
        return {
            "success": True,
            "message": f"Reset {reset_count} recipes with empty content",
            "recipes_reset": reset_count
        }
        
    except Exception as e:
        logger.error(f"Failed to reset empty content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/wprm-recipe-status/{recipe_id}")
async def get_wprm_recipe_status(recipe_id: int):
    """
    Get content status for a specific WPRM recipe
    
    Args:
        recipe_id: Recipe post ID
    
    Returns:
        Recipe with content status
    """
    try:
        status_repo = WPRMContentStatusRepository()
        wprm_repo = WPRMRecipeRepository()
        
        # Get recipe
        recipe = wprm_repo.get_recipe_by_id(recipe_id)
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recipe {recipe_id} not found"
            )
        
        # Get status
        status_obj = status_repo.get_status_by_recipe_id(recipe_id)
        
        if status_obj:
            recipe['content_status'] = {
                'status': status_obj.status,
                'content_generated': status_obj.content_generated,
                'posted': status_obj.posted,
                'generation_date': str(status_obj.generation_date) if status_obj.generation_date else None,
                'post_date': str(status_obj.post_date) if status_obj.post_date else None,
                'platforms_posted': status_obj.platforms_posted.split(',') if status_obj.platforms_posted else [],
                'retry_count': status_obj.retry_count,
                'last_error': status_obj.last_error,
                'notes': status_obj.notes
            }
            recipe['generated_content'] = status_repo.get_generated_content(recipe_id)
        else:
            recipe['content_status'] = {
                'status': 'not_tracked',
                'message': 'Run migration script to track this recipe'
            }
        
        return {
            "success": True,
            "recipe": recipe
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get recipe status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
