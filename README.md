<!-- TAMIL CONTENT - DEFAULT (Your full content, perfectly formatted) -->
<div id="tamilDiv" class="content">
  <div class="shields">
    [![Flutter](https://img.shields.io/badge/Flutter-3.8+-blue)](https://flutter.dev)
    [![FastAPI](https://img.shields.io/badge/FastAPI-0.104-yellow)](https://fastapi.tiangolo.com)
    [![Next.js](https://img.shields.io/badge/Next.js-16+-black)](https://nextjs.org)
    [![Python](https://img.shields.io/badge/Python-3.10+-green)](https://python.org)
  </div>

  <h1>Sattam AI – தமிழ்நாடு சட்டம் உதவியாளர் (Law Chatbot)</h1>

  <p>Sattam AI என்பது <strong>தமிழ்நாடு சட்டங்களுக்கான முழு‑முனை (full‑stack) AI உதவியாளர்</strong>. தமிழ்நாட்டின் சட்ட PDFகள் (சட்டங்கள், விதிகள், நெறிமுறைகள்) இங்கே ஏற்றப்பட்டு RAG (Retrieval‑Augmented Generation) மூலம் <strong>வெக்டர் தரவுத்தளத்தில் சேமிக்கப்படும்</strong>. இந்த அமைப்பு mobile (Flutter), web (Next.js) மற்றும் backend APIs (FastAPI) மூலம் <strong>சட்டம்‑சார்ந்த கேள்விகளுக்கு செயற்கை நுண்ணறிவு (AI) பதில்கள்</strong> அளிக்கிறது.</p>

  <h2>🚀 முக்கிய அம்சங்கள்</h2>
  <ul>
    <li><strong>RAG பைப்லைன்</strong>: சட்ட PDFகளிலிருந்து <code>sentence‑transformers</code> மூலம் embeddings உருவாக்கப்படுகிறது; ChromaDB‑ல் சேமிக்கப்படுகிறது.</li>
    <li><strong>பல‑LLM ஆதரவு</strong>: Google Gemini (இலவச‑தரவு) அல்லது OpenAI‑இணக்க மாடல் (Cloudflare AI Gateway).</li>
    <li><strong>ஆவண மேலாண்மை</strong>: தமிழ்நாடு சட்ட PDFகளை ஏற்றவும், வலை தரவுகளை உருவாக்கவும் ஆதரவு.</li>
    <li><strong>உரையாடல் பயன்பாடுகள்</strong>: Web/mobile‑ல் real‑time chat; context‑aware பதில்கள்.</li>
    <li><strong>அங்கீகாரம்</strong>: Clerk உடன் பயனர் மேலாண்மை.</li>
    <li><strong>குறுக்கு‑தளம்</strong>: Flutter mobile app, Next.js web app.</li>
    <li><strong>தரவு</strong>: ஏற்கனவே 50+ தமிழ்நாடு சட்டங்கள், விதிகள் (உதா: தமிழ்நாடு நிலச் சீரமைப்பு, நகராட்சி விதிகள்).</li>
  </ul>

  <h2>🏗️ அமைப்பு (Architecture)</h2>
  <pre><code>┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
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

Flutter mobile app, Next.js web app இரண்டும் backend FastAPI‑க்கு REST API மூலம் இணைக்கப்படுகின்றன. FastAPI RAG பைப்லைன், Gemini/OpenAI calls, Chroma vector store, meta‑data மற்றும் பயன்பாடாளர் மேலாண்மையை கையாளுகிறது.</code></pre>

  <h2>📦 முக்கிய பாகங்கள்</h2>
  <table>
    <thead>
      <tr>
        <th>பாகம்</th>
        <th>தொழில்நுட்பம்</th>
        <th>Path</th>
        <th>பயன்பாடு</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>பின்புறம்</td>
        <td>FastAPI, LangChain, ChromaDB</td>
        <td><code>Sattam-AI-Backend-main/</code></td>
        <td>PDF செயலாக்கம், RAG chat, APIs</td>
      </tr>
      <tr>
        <td>Web UI</td>
        <td>Next.js 16+, React 19, Tailwind, Clerk</td>
        <td><code>SattamAI-frontend-main/</code></td>
        <td>வலை உரையாடல் இடைமுகம்</td>
      </tr>
      <tr>
        <td>Mobile UI</td>
        <td>Flutter 3.8+, Clerk Flutter</td>
        <td><code>sattam_flutter-master/</code></td>
        <td>மொபைல் உரையாடல் இடைமுகம்</td>
      </tr>
    </tbody>
  </table>

  <h2>🚀 வேகமான துவக்கம் (Development)</h2>

  <h3>1. பின்புறம் (Backend)</h3>
  <pre><code>cd Sattam-AI-Backend-main
pip install -r requirements.txt
cp .env.example .env  # GEMINI_API_KEY அல்லது OPENAI_API_KEY சேர்க்கவும்
uvicorn app.main:app --host 0.0.0.0 --port 8000
# அல்லது Docker: docker-compose up --build</code></pre>
  <p><strong>API ஆவணங்கள்</strong>: <a href="http://localhost:8000/docs">http://localhost:8000/docs</a></p>

  <h3>2. Web Frontend</h3>
  <pre><code>cd SattamAI-frontend-main
npm install
npm run dev</code></pre>
  <p>திறக்கவும்: <a href="http://localhost:3000">http://localhost:3000</a></p>

  <h3>3. Flutter Mobile</h3>
  <pre><code>cd sattam_flutter-master
flutter pub get
flutter run</code></pre>

  <h2>🔧 சூழல் மாறிகள் (Backend)</h2>
  <pre><code>LLM_PROVIDER=google  # 'openai' அல்லது 'auto' என்றும் வரலாம்
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://gateway.ai.cloudflare.com/v1/...  # விருப்பம்</code></pre>

  <h2>📁 தரவு அமைவு</h2>
  <ul>
    <li><strong>PDFகள்</strong>: <code>Sattam-AI-Backend-main/data/pdfs/</code> (Land Reforms, Municipal Rules போன்ற 50+ தமிழ்நாடு சட்டங்கள்)</li>
    <li><strong>Vector தளம்</strong>: <code>Sattam-AI-Backend-main/data/vector_store/chroma.sqlite3</code></li>
    <li><strong>Metadata DB</strong>: <code>Sattam-AI-Backend-main/data/metadata.db</code></li>
  </ul>

  <h2>🛠️ பயன்படுத்திய தொழில்நுட்பங்கள்</h2>
  <h3>Backend (requirements.txt)</h3>
  <ul>
    <li>FastAPI 0.104, Uvicorn</li>
    <li>LangChain 0.0.333, ChromaDB 0.4.18</li>
    <li>sentence-transformers 5.1.2, pdfplumber, OpenAI, google-generativeai</li>
  </ul>

  <h3>Frontend (package.json)</h3>
  <ul>
    <li>Next.js 16.1.6, React 19.2.3</li>
    <li>@clerk/nextjs 6.37.1, TailwindCSS 4, Lucide React</li>
  </ul>

  <h3>Flutter (pubspec.yaml)</h3>
  <ul>
    <li>Flutter SDK ^3.8.1</li>
    <li>clerk_flutter 0.0.10-beta, http 1.2.2</li>
  </ul>

  <h2>🔄 முக்கிய API Endpoints (Backend)</h2>
  <ul>
    <li><code>POST /api/chat</code>: கேள்வியை அனுப்பி RAG பதிலைப் பெறுதல்</li>
    <li><code>POST /api/documents</code>: PDF ஏற்றும்</li>
    <li><code>GET /api/categories</code>: ஆவண பிரிவுகளைப் பட்டியலிடுதல்</li>
    <li><code>POST /api/admin/*</code>: ஆவணங்கள் / DB மேலாண்மை</li>
  </ul>

  <h2>🤝 பங்களிப்பு</h2>
  <ol>
    <li>Fork செய்து க்ளோன் செய்க.</li>
    <li>Feature branch உருவாக்கவும்.</li>
    <li>தேவைப்பட்டால் README ஏற்றும்.</li>
    <li>PR அனுப்பவும்.</li>
  </ol>

  <h2>📄 உரிமம்</h2>
  <p>MIT (component‑களின்படி).</p>

  <h2>🙏 நன்றி</h2>
  <ul>
    <li>தமிழ்நாடு சட்ட ஆவணங்கள் public ஆதாரங்களிலிருந்து.</li>
    <li>Google Gemini ஆக்க நோக்கிய செயற்கை நுண்ணறிவு உதவிக்கு。</li>
  </ul>

  <p><strong>GitHub‑ல் பதிவேற்றுதல்</strong>:</p>
  <pre><code>git init
git add .
git commit -m "Initial commit: Sattam AI Full-Stack Law Chatbot"
git remote add origin &lt;repo&gt;
git push -u origin main</code></pre>

  <p><strong>⭐ இந்த கிட்டுப்பு ரெபோவை ஸ்டார் செய்யவும்!</strong></p>
</div>
