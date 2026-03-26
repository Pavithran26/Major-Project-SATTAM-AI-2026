import os
from typing import List, Dict, Any
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from app.config import settings

class PDFProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", "।", " ", ""]  # Tamil-specific separators
        )
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF files"""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error extracting text from {pdf_path}: {e}")
        return text

    def process_pdf_file(self, pdf_path: str) -> List[Document]:
        """Process a single PDF file"""
        documents = []
        filename = os.path.basename(pdf_path)

        if not filename.lower().endswith(".pdf"):
            return documents

        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return documents

        metadata = {
            "source": filename,
            "type": "pdf",
            "language": self.detect_language(text),
        }

        chunks = self.text_splitter.split_text(text)
        for i, chunk in enumerate(chunks):
            documents.append(
                Document(
                    page_content=chunk,
                    metadata={**metadata, "chunk": i},
                )
            )

        return documents
    
    def process_pdf_directory(self, directory_path: str) -> List[Document]:
        """Process all PDFs in a directory"""
        documents = []
        
        for filename in os.listdir(directory_path):
            if filename.lower().endswith('.pdf'):
                pdf_path = os.path.join(directory_path, filename)
                print(f"Processing: {filename}")
                documents.extend(self.process_pdf_file(pdf_path))
        
        return documents
    
    def detect_language(self, text: str) -> str:
        """Simple language detection (can be enhanced)"""
        # Check for Tamil characters
        tamil_range = range(0x0B80, 0x0BFF)
        tamil_count = sum(1 for char in text if ord(char) in tamil_range)
        
        if tamil_count / max(len(text), 1) > 0.1:
            return "tamil"
        return "english"
