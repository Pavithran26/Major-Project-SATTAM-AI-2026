# Tamil Nadu Law Backend

A FastAPI-based backend for handling Tamil Nadu legal documents using RAG (Retrieval-Augmented Generation) with ChromaDB vector database and an OpenAI-compatible chat API (including Cloudflare AI Gateway).

## Features

- PDF document processing
- Web scraping for legal content
- Vector database for document embeddings
- RAG-based chat functionality
- Admin endpoints for management

## Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables in `.env`
4. Run the application: `uvicorn app.main:app --host 127.0.0.1 --port 8000`

Example LLM settings for Cloudflare AI Gateway (with provider toggle):

```env
LLM_PROVIDER=google

OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here

OPENAI_BASE_URL=https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_name>/compat
OPENAI_MODEL=openai/gpt-5
GOOGLE_MODEL=google-ai-studio/gemini-2.5-flash
```

Switch providers by changing one line:

- Free route (Google): `LLM_PROVIDER=google`
- OpenAI route: `LLM_PROVIDER=openai`
- Backward-compatible auto mode: `LLM_PROVIDER=auto` (infers from `OPENAI_MODEL`)

## Docker

Build and run with Docker Compose:

```bash
docker-compose up --build
```

## API Endpoints

- `/api/chat` - Chat with legal documents
- `/api/documents` - Upload and manage documents
- `/api/admin` - Administrative actions
