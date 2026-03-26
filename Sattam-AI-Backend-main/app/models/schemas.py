from pydantic import BaseModel
from typing import List, Optional

class DocumentSchema(BaseModel):
    title: str
    content: str
    source: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[List[str]] = None

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None

class AdminRequest(BaseModel):
    action: str
    data: Optional[dict] = None
