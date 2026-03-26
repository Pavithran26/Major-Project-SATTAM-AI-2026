from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, documents, admin, categories
from app.config import settings
from app.services.rag_service import RAGService

app = FastAPI(title="Tamil Nadu Law Chatbot API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your frontend URLs
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])

@app.on_event("startup")
async def startup_initialize_rag():
    """Initialize shared RAG service and optionally index local PDFs."""
    shared_rag_service = RAGService()
    chat.rag_service = shared_rag_service
    documents.rag_service = shared_rag_service

    if settings.AUTO_INDEX_PDFS_ON_STARTUP:
        result = shared_rag_service.index_pdf_directory(
            settings.PDF_DIRECTORY,
            force_reindex=settings.FORCE_REINDEX_ON_STARTUP,
        )
        print(f"Startup PDF indexing: {result}", flush=True)
    else:
        print("Startup PDF indexing: skipped (AUTO_INDEX_PDFS_ON_STARTUP=false)", flush=True)

@app.get("/")
async def root():
    return {"message": "Tamil Nadu Law Chatbot API", "status": "running"}
