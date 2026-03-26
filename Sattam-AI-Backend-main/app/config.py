from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # LLM API (OpenAI-compatible; supports Cloudflare AI Gateway base URL)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None
    # Provider toggle: "google", "openai", or "auto" (infer from OPENAI_MODEL).
    LLM_PROVIDER: str = "auto"
    OPENAI_MODEL: str = "openai/gpt-5"
    GOOGLE_MODEL: str = "google-ai-studio/gemini-2.5-flash"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 900

    # Legacy Gemini keys kept optional for backward compatibility.
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Vector Database
    CHROMA_DB_PATH: str = "./data/vector_store"
    VECTOR_DB_PATH: str = "./data/vector_store"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Database
    METADATA_DB_URL: str = "sqlite:///./data/metadata.db"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Chunking settings
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Web scraping
    USER_AGENT: str = "TamilNaduLawBot/1.0"

    # Startup indexing
    AUTO_INDEX_PDFS_ON_STARTUP: bool = True
    FORCE_REINDEX_ON_STARTUP: bool = False
    PDF_DIRECTORY: str = "./data/pdfs"

    class Config:
        env_file = ".env"

settings = Settings()
