# src/controllers/ebook_controller.py
 
import logging
import os
 
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
 
from src.domain.schemas.ebook_schemas import (
    GenerateEbookRequest,
    GenerateEbookResponse,
    EbookTopicSuggestion,
    EbookTopicSuggestionsResponse,
    EbookFormat,
)
from src.use_cases.generate_ebook import GenerateEbookUseCase, EBOOK_OUTPUT_DIR
 
logger = logging.getLogger(__name__)
 
router = APIRouter(prefix="/api/ebooks", tags=["E-Books"])
 
 
@router.get("/topics", response_model=EbookTopicSuggestionsResponse)
async def suggest_ebook_topics(days: int = 60):
    """Suggest e-book topics for the next `days`, prioritising upcoming holidays (WBS 4.1)."""
    try:
        use_case = GenerateEbookUseCase()
        suggestions = use_case.suggest_topics(days=days)
        return EbookTopicSuggestionsResponse(
            total=len(suggestions),
            suggestions=[EbookTopicSuggestion(**s) for s in suggestions],
        )
    except Exception as e:
        logger.error(f"Failed to suggest e-book topics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
 
 
@router.post("/generate", response_model=GenerateEbookResponse,
             status_code=status.HTTP_201_CREATED)
async def generate_ebook(request: GenerateEbookRequest):
    """Generate a recipe e-book (PDF) from the WPRM recipe database + AI prose.
 
    Provide `recipe_ids` for an explicit selection, a `topic` to search by, or
    neither to use the most recent recipes.
    """
    try:
        use_case = GenerateEbookUseCase()
        result = await use_case.generate(
            topic=request.topic,
            recipe_ids=request.recipe_ids,
            title=request.title,
            author=request.author,
            tone=request.tone,
            max_recipes=request.max_recipes,
            include_nutrition=request.include_nutrition,
        )
        return GenerateEbookResponse(
            success=result["success"],
            message=result["message"],
            title=result["title"],
            filename=result["filename"],
            download_url=result["download_url"],
            format=EbookFormat(result["format"]),
            recipe_count=result["recipe_count"],
            file_size_bytes=result["file_size_bytes"],
            funnel=result["funnel"],
        )
    except ValueError as e:
        logger.warning(f"E-book generation validation error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate e-book: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
 
 
@router.get("/download/{filename}")
async def download_ebook(filename: str):
    """Download a generated e-book (WBS 4.4 delivery seam).
 
    NOTE: this route is currently behind the same auth gate as the rest of the
    API. For a public lead-magnet funnel, expose a separate unauthenticated
    delivery route (e.g. signed URLs) rather than opening this one.
    """
    # Guard against path traversal: only allow a bare filename.
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
 
    path = os.path.join(EBOOK_OUTPUT_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="E-book not found")
 
    return FileResponse(path, media_type="application/pdf", filename=filename)
 