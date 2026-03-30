# Sattam AI – தமிழ்நாடு சட்டம் உதவியாளர் (Law Chatbot)

[![Flutter](https://img.shields.io/badge/Flutter-3.8+-blue)](https://flutter.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-yellow)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-green)](https://python.org)

Sattam AI என்பது **தமிழ்நாடு சட்டங்களுக்கான முழு‑முனை (full‑stack) AI உதவியாளர்**. தமிழ்நாட்டின் சட்ட PDFகள் (சட்டங்கள், விதிகள், நெறிமுறைகள்) இங்கே ஏற்றப்பட்டு RAG (Retrieval‑Augmented Generation) மூலம் **வெக்டர் தரவுத்தளத்தில் சேமிக்கப்படும்**. இந்த அமைப்பு mobile (Flutter), web (Next.js) மற்றும் backend APIs (FastAPI) மூலம் **சட்டம்‑சார்ந்த கேள்விகளுக்கு செயற்கை நுண்ணறிவு (AI) பதில்கள்** அளிக்கிறது.

## 🚀 முக்கிய அம்சங்கள்

- **RAG பைப்லைன்**: சட்ட PDFகளிலிருந்து `sentence‑transformers` மூலம் embeddings உருவாக்கப்படுகிறது; ChromaDB‑ல் சேமிக்கப்படுகிறது.
- **பல‑LLM ஆதரவு**: Google Gemini (இலவச‑தரவு) அல்லது OpenAI‑இணக்க மாடல் (Cloudflare AI Gateway).
- **ஆவண மேலாண்மை**: தமிழ்நாடு சட்ட PDFகளை ஏற்றவும், வலை தரவுகளை உருவாக்கவும் ஆதரவு.
- **உரையாடல் பயன்பாடுகள்**: Web/mobile‑ல் real‑time chat; context‑aware பதில்கள்.
- **அங்கீகாரம்**: Clerk உடன் பயனர் மேலாண்மை.
- **குறுக்கு‑தளம்**: Flutter mobile app, Next.js web app.
- **தரவு**: ஏற்கனவே 50+ தமிழ்நாடு சட்டங்கள், விதிகள் (உதா: தமிழ்நாடு நிலச் சீரமைப்பு, நகராட்சி விதிகள்).

## 🏗️ அமைப்பு (Architecture)
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Flutter App │ │ Next.js Web │ │ Legal PDFs │
│ (Mobile) │◄──►│ Frontend │◄──►│ (50+ TN Laws) │
└─────────────────┘ └──────────────────┘ └─────────────────┘
▲
│ REST APIs (Chat, Docs, Admin)
▼
┌──────────────────┐
│ FastAPI Backend │
│ - RAG Service │
│ - Gemini/OpenAI │
│ - Chroma Vector │
└──────────────────┘

Flutter mobile app, Next.js web app இரண்டும் backend FastAPI‑க்கு REST API மூலம் இணைக்கப்படுகின்றன. FastAPI RAG பைப்லைன், Gemini/OpenAI calls, Chroma vector store, meta‑data மற்றும் பயன்பாடாளர் மேலாண்மையை கையாளுகிறது.

## 📦 முக்கிய பாகங்கள்

| பாகம் | தொழில்நுட்பம் | Path | பயன்பாடு |
|--------|------------------|------|-----------|
| பின்புறம் | FastAPI, LangChain, ChromaDB | `Sattam-AI-Backend-main/` | PDF செயலாக்கம், RAG chat, APIs |
| Web UI | Next.js 16+, React 19, Tailwind, Clerk | `SattamAI-frontend-main/` | வலை உரையாடல் இடைமுகம் |
| Mobile UI | Flutter 3.8+, Clerk Flutter | `sattam_flutter-master/` | மொபைல் உரையாடல் இடைமுகம் |

## 🚀 வேகமான துவக்கம் (Development)

### 1. பின்புறம் (Backend)
```bash
cd Sattam-AI-Backend-main
pip install -r requirements.txt
cp .env.example .env  # GEMINI_API_KEY அல்லது OPENAI_API_KEY சேர்க்கவும்
uvicorn app.main:app --host 0.0.0.0 --port 8000
# அல்லது Docker: docker-compose up --build
```

**API ஆவணங்கள்**: http://localhost:8000/docs

### 2. Web Frontend
```bash
cd SattamAI-frontend-main
npm install
npm run dev
```
திறக்கவும்: http://localhost:3000

### 3. Flutter Mobile
```bash
cd sattam_flutter-master
flutter pub get
flutter run
```

## 🔧 சூழல் மாறிகள் (Backend)

Backend மூலத்தில் `.env` கோப்பை உருவாக்கவும்:
LLM_PROVIDER=google # 'openai' அல்லது 'auto' என்றும் வரலாம்
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://gateway.ai.cloudflare.com/v1/... # விருப்பம்

## 📁 தரவு அமைவு

- **PDFகள்**: `Sattam-AI-Backend-main/data/pdfs/` (Land Reforms, Municipal Rules போன்ற 50+ தமிழ்நாடு சட்டங்கள்)
- **Vector தளம்**: `Sattam-AI-Backend-main/data/vector_store/chroma.sqlite3`
- **Metadata DB**: `Sattam-AI-Backend-main/data/metadata.db`

## 🛠️ பயன்படுத்திய தொழில்நுட்பங்கள்

### Backend (requirements.txt)
- FastAPI 0.104, Uvicorn
- LangChain 0.0.333, ChromaDB 0.4.18
- sentence-transformers 5.1.2, pdfplumber, OpenAI, google-generativeai

### Frontend (package.json)
- Next.js 16.1.6, React 19.2.3
- @clerk/nextjs 6.37.1, TailwindCSS 4, Lucide React

### Flutter (pubspec.yaml)
- Flutter SDK ^3.8.1
- clerk_flutter 0.0.10-beta, http 1.2.2

## 🔄 முக்கிய API Endpoints (Backend)

- `POST /api/chat`: கேள்வியை அனுப்பி RAG பதிலைப் பெறுதல்.
- `POST /api/documents`: PDF ஏற்றும்.
- `GET /api/categories`: ஆவண பிரிவுகளைப் பட்டியலிடுதல்.
- `POST /api/admin/*`: ஆவணங்கள் / DB மேலாண்மை.

## 🤝 பங்களிப்பு

1. Fork செய்து க்ளோன் செய்க.
2. Feature branch உருவாக்கவும்.
3. தேவைப்பட்டால் README ஏற்றும்.
4. PR அனுப்பவும்.

## 📄 உரிமம்

MIT (component‑களின்படி).

## 🙏 நன்றி

- தமிழ்நாடு சட்ட ஆவணங்கள் public ஆதாரங்களிலிருந்து.
- Google Gemini ஆக்க நோக்கிய செயற்கை நுண்ணறிவு உதவிக்கு.

**GitHub‑ல் பதிவேற்றுதல்**:
```bash
git init
git add .
git commit -m "Initial commit: Sattam AI Full-Stack Law Chatbot"
git remote add origin <repo>
git push -u origin main
```

⭐ இந்த கிட்டுப்பு ரெபோவை ஸ்டார் செய்யவும்!
