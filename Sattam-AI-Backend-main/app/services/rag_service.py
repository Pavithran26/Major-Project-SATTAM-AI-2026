import os
import re
from typing import List, Dict, Any
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from app.config import settings
from app.services.gemini_service import GeminiService
from app.services.pdf_processor import PDFProcessor

class RAGService:
    _SMALL_TALK_PATTERN = re.compile(
        r"^(hi|hello|hey|yo|good\s*(morning|afternoon|evening)|vanakkam|வணக்கம்|ஹாய்|ஹலோ)$",
        flags=re.IGNORECASE,
    )
    _LEGAL_HINT_PATTERN = re.compile(
        r"(law|legal|act|section|court|fir|police|bail|ipc|crpc|constitution|rights?|complaint|"
        r"tenant|landlord|property|document|petition|advocate|case|judge|arrest|warrant|"
        r"சட்ட|நீதிமன்ற|வழக்கு|பிரிவு|புகார்|காவல்|ஜாமீன்|உரிமை|ஆவணம்)",
        flags=re.IGNORECASE,
    )
    _NON_LEGAL_PATTERN = re.compile(
        r"(who\s+is|tell\s+me\s+about|do\s+you\s+know|weather|movie|song|cricket|football|"
        r"modi|modiji|celebrity|joke|recipe)",
        flags=re.IGNORECASE,
    )

    def __init__(self):
        # Initialize LLM service (OpenAI-compatible implementation)
        self.llm_service = GeminiService()
        self.embeddings = None
        self.vector_store = None

        try:
            self._sanitize_tls_bundle_env()
            os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)

            # Initialize embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL
            )

            # Initialize vector store
            self.vector_store = Chroma(
                persist_directory=settings.VECTOR_DB_PATH,
                embedding_function=self.embeddings
            )
        except Exception as e:
            # Keep chat service available even if vector dependencies are missing.
            print(f"Warning: vector store initialization failed: {e}")

    def _sanitize_tls_bundle_env(self):
        """Unset invalid TLS bundle env vars that can break dependency downloads."""
        for env_name in ("REQUESTS_CA_BUNDLE", "CURL_CA_BUNDLE"):
            bundle_path = os.environ.get(env_name)
            if bundle_path and not os.path.exists(bundle_path):
                print(f"Warning: ignoring invalid {env_name} path: {bundle_path}")
                os.environ.pop(env_name, None)
    
    def add_documents(self, documents: List):
        """Add documents to vector store"""
        if documents and self.vector_store is not None:
            self.vector_store.add_documents(documents)
            self.vector_store.persist()

    def get_vector_document_count(self) -> int:
        """Return current stored chunk count in vector DB."""
        if self.vector_store is None:
            return 0
        try:
            return self.vector_store._collection.count()
        except Exception as e:
            print(f"Warning: failed to read vector count: {e}")
            return 0

    def index_pdf_directory(self, directory_path: str, force_reindex: bool = False) -> Dict[str, Any]:
        """Index all PDFs in a directory into the vector store."""
        if self.vector_store is None:
            return {
                "status": "skipped",
                "reason": "vector_store_unavailable",
                "pdf_files": 0,
                "chunks_added": 0,
            }

        if not os.path.isdir(directory_path):
            return {
                "status": "skipped",
                "reason": "pdf_directory_missing",
                "pdf_files": 0,
                "chunks_added": 0,
            }

        existing_chunks = self.get_vector_document_count()
        if existing_chunks > 0 and not force_reindex:
            return {
                "status": "skipped",
                "reason": "already_indexed",
                "existing_chunks": existing_chunks,
                "pdf_files": 0,
                "chunks_added": 0,
            }

        pdf_files = [name for name in os.listdir(directory_path) if name.lower().endswith(".pdf")]
        if not pdf_files:
            return {
                "status": "skipped",
                "reason": "no_pdf_files_found",
                "pdf_files": 0,
                "chunks_added": 0,
            }

        processor = PDFProcessor()
        documents = processor.process_pdf_directory(directory_path)
        if not documents:
            return {
                "status": "skipped",
                "reason": "no_extractable_text",
                "pdf_files": len(pdf_files),
                "chunks_added": 0,
            }

        self.add_documents(documents)
        return {
            "status": "indexed",
            "pdf_files": len(pdf_files),
            "chunks_added": len(documents),
            "total_chunks_after": self.get_vector_document_count(),
        }
    
    def search_relevant_chunks(self, query: str, k: int = 5) -> List[str]:
        """Search for relevant document chunks"""
        if self.vector_store is None:
            return []

        try:
            normalized_query = " ".join((query or "").split())
            if not normalized_query:
                return []

            # Prefer scored search to reduce irrelevant chunks.
            # For Chroma distance score: lower is better.
            docs = []
            if hasattr(self.vector_store, "similarity_search_with_score"):
                scored = self.vector_store.similarity_search_with_score(
                    normalized_query,
                    k=max(k * 2, 8),
                )
                for doc, score in scored:
                    if score is None or score <= 1.15:
                        docs.append(doc)
                    if len(docs) >= k:
                        break

            if not docs:
                docs = self.vector_store.similarity_search(normalized_query, k=k)

            contexts: List[str] = []
            seen = set()
            for doc in docs:
                raw_text = str(getattr(doc, "page_content", "") or "")
                cleaned = " ".join(raw_text.split())
                if len(cleaned) < 120:
                    continue
                signature = cleaned.lower()
                if signature in seen:
                    continue
                seen.add(signature)
                contexts.append(cleaned)
                if len(contexts) >= k:
                    break
            return contexts
            
        except Exception as e:
            print(f"Error in search: {e}")
            return []

    def _is_small_talk(self, query: str) -> bool:
        text = " ".join((query or "").split())
        if not text:
            return True
        if self._SMALL_TALK_PATTERN.match(text):
            return True
        return False

    def _small_talk_reply(self, language: str) -> str:
        is_tamil = str(language).lower().startswith("ta")
        if is_tamil:
            return (
                "வணக்கம்! நான் தமிழ்நாடு சட்ட உதவியாளர். "
                "உங்கள் சட்ட பிரச்சனையை ஒரு அல்லது இரண்டு வரிகளில் எழுதுங்கள்."
            )
        return (
            "Hello. I am your Tamil Nadu legal assistant. "
            "Please describe your legal issue in one or two lines."
        )

    def _non_legal_reply(self, language: str) -> str:
        is_tamil = str(language).lower().startswith("ta")
        if is_tamil:
            return (
                "நான் சட்ட தொடர்பான கேள்விகளுக்கே உதவ முடியும்.\n"
                "தயவுசெய்து உங்கள் சட்ட பிரச்சனையை எழுதுங்கள் (எ.கா., FIR, ஜாமீன், சொத்து விவகாரம்)."
            )
        return (
            "I can help only with legal questions.\n"
            "Please share your legal issue (for example: FIR, bail, or property dispute)."
        )
    
    def get_answer(self, query: str, language: str = "en") -> Dict[str, Any]:
        """Get answer using RAG pipeline"""
        if self._is_small_talk(query):
            return {
                "answer": self._small_talk_reply(language),
                "sources": [],
                "relevant_chunks": [],
            }

        normalized_query = " ".join((query or "").split())
        if (
            self._NON_LEGAL_PATTERN.search(normalized_query)
            and not self._LEGAL_HINT_PATTERN.search(normalized_query)
        ):
            return {
                "answer": self._non_legal_reply(language),
                "sources": [],
                "relevant_chunks": [],
            }

        # 1. Retrieve relevant context
        contexts = self.search_relevant_chunks(query)
        if not contexts and not self._LEGAL_HINT_PATTERN.search(normalized_query):
            return {
                "answer": self._non_legal_reply(language),
                "sources": [],
                "relevant_chunks": [],
            }

        # 2. Generate response using LLM
        response = self.llm_service.generate_response(query, contexts, language=language)
        answer_text = str(response.get("response", ""))
        lowered = answer_text.lower()
        response_sources = response.get("sources", []) or []
        if (
            "llm quota is exceeded" in lowered
            or "quota currently exceeded" in lowered
            or "ai generation is currently unavailable" in lowered
            or "api key is invalid or unauthorized" in lowered
            or "missing api key" in lowered
            or "unauthorized" in lowered
        ):
            response_sources = []
        
        return {
            "answer": answer_text,
            "sources": response_sources,
            "relevant_chunks": contexts[:3]  # Return top 3 chunks
        }
    
    def tamil_enhanced_search(self, tamil_query: str) -> List[str]:
        """Enhanced search for Tamil queries"""
        # You can add Tamil-specific search logic here
        return self.search_relevant_chunks(tamil_query)
