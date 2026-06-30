# src/domain/schemas/ebook_schemas.py
 
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
 
 
class EbookFormat(str, Enum):
    """Supported e-book output formats."""
    PDF = "pdf"
 
 
class GenerateEbookRequest(BaseModel):
    """Request to generate an AI-assisted recipe e-book.
 
    Provide either an explicit list of ``recipe_ids`` (recipes are pulled from
    the WPRM recipe database in that order) or a ``topic`` string (recipes are
    discovered by searching recipe titles). If both are omitted, the most
    recent published recipes are used.
    """
    title: Optional[str] = Field(
        default=None,
        description="Override the e-book title. If omitted, the title is drafted by the LLM.",
    )
    topic: Optional[str] = Field(
        default=None,
        description="Topic/holiday to build the e-book around, e.g. 'Hanukkah'. "
                    "Used to search the recipe database when recipe_ids is not given.",
    )
    recipe_ids: Optional[List[int]] = Field(
        default=None,
        description="Explicit WPRM recipe IDs to include, in order.",
    )
    max_recipes: int = Field(
        default=10, ge=1, le=50,
        description="Maximum number of recipes to include in the e-book.",
    )
    author: str = Field(default="Tori Avey", description="Author name shown on the cover.")
    tone: str = Field(
        default="warm, personal, and story-driven",
        description="Editorial tone for AI-drafted prose (foreword and recipe headnotes).",
    )
    include_nutrition: bool = Field(
        default=True, description="Include a nutrition summary per recipe when available.",
    )
    format: EbookFormat = Field(default=EbookFormat.PDF, description="Output file format.")
 
 
class EbookTopicSuggestion(BaseModel):
    """A suggested e-book topic, optionally tied to an upcoming holiday."""
    topic: str
    reason: str
    holiday_date: Optional[str] = None
    holiday_type: Optional[str] = None
    estimated_recipe_matches: Optional[int] = None
 
 
class EbookTopicSuggestionsResponse(BaseModel):
    """Response for the topic-mapping endpoint (WBS 4.1)."""
    total: int
    suggestions: List[EbookTopicSuggestion]
 
 
class GenerateEbookResponse(BaseModel):
    """Response after generating an e-book."""
    success: bool
    message: str
    title: str
    filename: str
    download_url: str
    format: EbookFormat
    recipe_count: int
    file_size_bytes: int
    # Funnel-integration seam (WBS 4.4): metadata a downstream sales funnel /
    # web flow can consume. Populated with sensible defaults for now.
    funnel: Dict[str, Any] = Field(default_factory=dict)
 