from typing import List

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.routes.chat import get_rag_service
from app.services.category_service import CategoryStudyService

router = APIRouter()


class CategoryStudyResponse(BaseModel):
    id: int
    title_en: str
    title_ta: str
    description_en: str
    description_ta: str
    overview: str
    learn_points: List[str]
    references: List[str]
    source_count: int
    source_type: str


@router.get("/study", response_model=List[CategoryStudyResponse])
async def get_study_categories(
    language: str = Query(default="en", pattern="^(en|ta|EN|TA)$"),
    k: int = Query(default=8, ge=3, le=20),
):
    """
    Build the 12 branch study cards from indexed legal DB content.
    """
    rag_service = get_rag_service()
    service = CategoryStudyService(rag_service)
    return service.build_categories(language=language.lower(), top_k=k)
