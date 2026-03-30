# Sattam AI - Tamil Nadu Law Chatbot

[![Flutter](https://img.shields.io/badge/Flutter-3.8+-blue)](https://flutter.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-yellow)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-green)](https://python.org)

Sattam AI is a full-stack AI-powered legal assistant specialized for Tamil Nadu laws. It ingests Tamil Nadu legal PDFs (acts, rules, regulations), processes them into a vector database using RAG (Retrieval-Augmented Generation), and provides intelligent chat-based querying via mobile (Flutter), web (Next.js), and backend APIs (FastAPI).

## 🚀 Features

- **RAG Pipeline**: Embeddings from legal PDFs using sentence-transformers, stored in ChromaDB.
- **Multi-LLM Support**: Google Gemini (free tier) or OpenAI-compatible (via Cloudflare AI Gateway).
- **Document Management**: Upload/process Tamil Nadu law PDFs, web scraping support.
- **Chat Interfaces**: Real-time chat on web/mobile with context-aware responses.
- **Auth**: Clerk integration for user management.
- **Cross-Platform**: Flutter mobile app, Next.js web app.
- **Data**: Pre-loaded with 50+ Tamil Nadu acts/rules (e.g., Tamil Nadu Land Reforms, Municipal Rules).

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flutter App   │    │  Next.js Web     │    │   Legal PDFs    │
│  (Mobile)       │◄──►│    Frontend      │◄──►│  (50+ TN Laws)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              ▲
                              │ REST APIs (Chat, Docs, Admin)
                              ▼
                       ┌──────────────────┐
                       │ FastAPI Backend  │
                       │ - RAG Service    │
                       │ - Gemini/OpenAI  │
                       │ - Chroma Vector  │
                       └──────────────────┘
```

## 📦 Components

| Component | Tech | Path | Purpose |
|-----------|------|------|---------|
| Backend | FastAPI, LangChain, ChromaDB | `Sattam-AI-Backend-main/` | PDF processing, RAG chat, APIs |
| Web Frontend | Next.js 16+, React 19, Tailwind, Clerk | `SattamAI-frontend-main/` | Web chat UI |
| Mobile App | Flutter 3.8+, Clerk Flutter | `sattam_flutter-master/` | Mobile chat UI |

## 🚀 Quick Start (Development)

### 1. Backend
```bash
cd Sattam-AI-Backend-main
pip install -r requirements.txt
cp .env.example .env  # Add GEMINI_API_KEY or OPENAI_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Or Docker: docker-compose up --build
```

**API Docs**: http://localhost:8000/docs

### 2. Web Frontend
```bash
cd SattamAI-frontend-main
npm install
npm run dev
```
Open http://localhost:3000

### 3. Flutter Mobile
```bash
cd sattam_flutter-master
flutter pub get
flutter run
```

## 🔧 Environment Variables (Backend)

Create `.env` in backend root:
```
LLM_PROVIDER=google  # or 'openai' or 'auto'
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://gateway.ai.cloudflare.com/v1/...  # Optional
```

## 📁 Data
- **PDFs**: `Sattam-AI-Backend-main/data/pdfs/` (Tamil Nadu acts like Land Reforms, Municipal Rules).
- **Vector Store**: `Sattam-AI-Backend-main/data/vector_store/chroma.sqlite3`.
- **Metadata DB**: `Sattam-AI-Backend-main/data/metadata.db`.

## 🛠️ Tech Stack

### Backend Dependencies (requirements.txt)
- FastAPI 0.104, Uvicorn
- LangChain 0.0.333, ChromaDB 0.4.18
- sentence-transformers 5.1.2, pdfplumber, OpenAI, google-generativeai

### Frontend (package.json)
- Next.js 16.1.6, React 19.2.3
- @clerk/nextjs 6.37.1, TailwindCSS 4, Lucide React

### Flutter (pubspec.yaml)
- Flutter SDK ^3.8.1
- clerk_flutter 0.0.10-beta, http 1.2.2

## 🔄 API Endpoints (Backend)
- `POST /api/chat`: Send query, get RAG response.
- `POST /api/documents`: Upload PDF.
- `GET /api/categories`: List document categories.
- `POST /api/admin/*`: Manage docs/DB.

## 🤝 Contributing
1. Fork & clone.
2. Create feature branch.
3. Update README if needed.
4. Submit PR.

## 📄 License
MIT (inferred from components).

## 🙏 Acknowledgments
- Tamil Nadu legal documents from public sources.
- Google Gemini for AI powering.

**Upload to GitHub**: `git init`, `git add .`, `git commit -m \"Initial commit: Sattam AI Full-Stack Law Chatbot\"`, `git remote add origin <repo>`, `git push -u origin main`.

⭐ Star this repo!

