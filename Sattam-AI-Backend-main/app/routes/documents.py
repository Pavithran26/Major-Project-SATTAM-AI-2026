from fastapi import APIRouter, UploadFile, File, BackgroundTasks
import shutil
import os
from typing import List
from app.services.pdf_processor import PDFProcessor
from app.services.web_scraper import TamilNaduLawScraper
from app.services.rag_service import RAGService

router = APIRouter()
pdf_processor = PDFProcessor()
scraper = TamilNaduLawScraper()
rag_service = None

def get_rag_service():
    global rag_service
    if rag_service is None:
        rag_service = RAGService()
    return rag_service

@router.post("/upload-pdfs")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """Upload and process PDF files"""
    os.makedirs("./data/pdfs", exist_ok=True)
    saved_files = []
    all_documents = []
    service = get_rag_service()
    
    for file in files:
        # Save file
        file_path = f"./data/pdfs/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(file.filename)
        
        # Process only the uploaded file
        all_documents.extend(pdf_processor.process_pdf_file(file_path))

    if all_documents:
        service.add_documents(all_documents)
    
    return {
        "message": f"Processed {len(saved_files)} files",
        "chunks_added": len(all_documents),
        "files": saved_files
    }

@router.post("/scrape-website")
async def scrape_website(url: str, background_tasks: BackgroundTasks):
    """Scrape law website"""
    background_tasks.add_task(scrape_and_process, url)
    return {"message": "Scraping started in background", "url": url}

async def scrape_and_process(url: str):
    """Background task for scraping"""
    try:
        documents = scraper.scrape_website(url)
        if documents:
            service = get_rag_service()
            service.add_documents(documents)
    except Exception as e:
        print(f"Error in background scraping: {e}")

@router.get("/document-stats")
async def get_document_stats():
    """Get statistics about stored documents"""
    # This would query your metadata database
    return {
        "total_documents": 100,  # Example
        "pdf_count": 50,
        "webpage_count": 50,
        "last_updated": "2024-01-15"
    }
