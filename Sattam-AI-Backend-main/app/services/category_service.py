import re
from typing import Any, Dict, List

from app.services.rag_service import RAGService


CATEGORY_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "title_en": "Property & Land Laws",
        "title_ta": "சொத்து & நிலச் சட்டங்கள்",
        "description_en": "Land disputes, property registration, tenant rights",
        "description_ta": "நில விவகாரங்கள், சொத்து பதிவு, குடியிருப்பாளர் உரிமைகள்",
        "keywords": ["patta", "land", "registration", "tenancy", "property"],
    },
    {
        "id": 2,
        "title_en": "Accident & Motor Vehicle",
        "title_ta": "விபத்து & மோட்டார் வாகனம்",
        "description_en": "Road accidents, insurance claims, traffic violations",
        "description_ta": "சாலை விபத்துகள், காப்பீட்டு கோரிக்கைகள், போக்குவரத்து மீறல்கள்",
        "keywords": ["motor vehicle", "accident", "insurance", "traffic", "compensation"],
    },
    {
        "id": 3,
        "title_en": "Employment & Labor",
        "title_ta": "வேலைவாய்ப்பு & தொழிலாளர்",
        "description_en": "Workplace rights, wages, termination disputes",
        "description_ta": "பணியிட உரிமைகள், ஊதியங்கள், பணிநீக்கம் விவகாரங்கள்",
        "keywords": ["labour", "wages", "employment", "termination", "workplace"],
    },
    {
        "id": 4,
        "title_en": "Family & Marriage",
        "title_ta": "குடும்பம் & திருமணம்",
        "description_en": "Divorce, maintenance, child custody, inheritance",
        "description_ta": "விவாகரத்து, பராமரிப்பு, குழந்தை வளர்ப்பு, பாரம்பரியம்",
        "keywords": ["family", "marriage", "divorce", "custody", "maintenance"],
    },
    {
        "id": 5,
        "title_en": "Civil Disputes",
        "title_ta": "சிவில் வழக்குகள்",
        "description_en": "Consumer complaints, contract issues, monetary disputes",
        "description_ta": "நுகர்வோர் புகார்கள், ஒப்பந்த பிரச்சனைகள், பண விவகாரங்கள்",
        "keywords": ["civil", "contract", "consumer", "suit", "dispute"],
    },
    {
        "id": 6,
        "title_en": "Criminal Laws",
        "title_ta": "குற்றவியல் சட்டங்கள்",
        "description_en": "FIR procedures, bail, court proceedings",
        "description_ta": "FIR நடைமுறைகள், ஜாமீன், நீதிமன்ற நடைமுறைகள்",
        "keywords": ["criminal", "fir", "bail", "arrest", "offence"],
    },
    {
        "id": 7,
        "title_en": "Education Rights",
        "title_ta": "கல்வி உரிமைகள்",
        "description_en": "Admission issues, reservation policies, fee structure",
        "description_ta": "சேர்க்கை பிரச்சனைகள், இடஒதுக்கீடு கொள்கைகள், கட்டண அமைப்பு",
        "keywords": ["education", "admission", "reservation", "student", "fee"],
    },
    {
        "id": 8,
        "title_en": "Government Schemes",
        "title_ta": "அரசு திட்டங்கள்",
        "description_en": "TN welfare schemes, subsidies, application procedures",
        "description_ta": "தமிழ்நாடு நலத்திட்டங்கள், மானியங்கள், விண்ணப்ப நடைமுறைகள்",
        "keywords": ["scheme", "welfare", "subsidy", "beneficiary", "application"],
    },
    {
        "id": 9,
        "title_en": "RTI & Official Matters",
        "title_ta": "RTI & அதிகாரப்பூர்வ விஷயங்கள்",
        "description_en": "Right to Information, official document procedures",
        "description_ta": "தகவல் அறியும் உரிமை, அதிகாரப்பூர்வ ஆவண நடைமுறைகள்",
        "keywords": ["rti", "information", "public authority", "official records", "appeal"],
    },
    {
        "id": 10,
        "title_en": "Women & Child Rights",
        "title_ta": "பெண்கள் & குழந்தை உரிமைகள்",
        "description_en": "Protection laws, harassment, child welfare",
        "description_ta": "பாதுகாப்பு சட்டங்கள், துன்புறுத்தல், குழந்தை நலன்",
        "keywords": ["women", "child", "harassment", "protection", "welfare"],
    },
    {
        "id": 11,
        "title_en": "Professional Regulations",
        "title_ta": "தொழில்முறை விதிமுறைகள்",
        "description_en": "Medical, legal, engineering professional conduct",
        "description_ta": "மருத்துவ, சட்ட, பொறியியல் தொழில்முறை நடத்தை",
        "keywords": ["professional", "regulation", "license", "disciplinary", "conduct"],
    },
    {
        "id": 12,
        "title_en": "Cyber & Digital Laws",
        "title_ta": "சைபர் & டிஜிட்டல் சட்டங்கள்",
        "description_en": "Online fraud, data privacy, digital signatures",
        "description_ta": "ஆன்லைன் மோசடி, தரவு தனியுரிமை, டிஜிட்டல் கையொப்பங்கள்",
        "keywords": ["cyber", "digital", "online fraud", "privacy", "electronic"],
    },
]


class CategoryStudyService:
    def __init__(self, rag_service: RAGService):
        self.rag_service = rag_service

    def build_categories(self, language: str = "en", top_k: int = 8) -> List[Dict[str, Any]]:
        safe_language = "ta" if language.lower().startswith("ta") else "en"
        safe_k = max(3, min(top_k, 20))
        items = []

        for category in CATEGORY_DEFINITIONS:
            docs = self._search_category_docs(category, k=safe_k)
            content_chunks = self._get_unique_chunks(docs)

            items.append(
                {
                    "id": category["id"],
                    "title_en": category["title_en"],
                    "title_ta": category["title_ta"],
                    "description_en": category["description_en"],
                    "description_ta": category["description_ta"],
                    "overview": self._build_overview(
                        chunks=content_chunks,
                        description=category["description_ta"] if safe_language == "ta" else category["description_en"],
                        language=safe_language,
                    ),
                    "learn_points": self._build_learn_points(content_chunks, safe_language),
                    "references": self._build_references(docs, safe_language),
                    "source_count": len(docs),
                    "source_type": "vector_db",
                }
            )

        return items

    def _search_category_docs(self, category: Dict[str, Any], k: int) -> List[Any]:
        if self.rag_service.vector_store is None:
            return []

        query = (
            f"{category['title_en']} Tamil Nadu legal context "
            f"{' '.join(category['keywords'])}"
        )
        try:
            return self.rag_service.vector_store.similarity_search(query, k=k)
        except Exception as e:
            print(f"Warning: category search failed for {category['title_en']}: {e}")
            return []

    def _get_unique_chunks(self, docs: List[Any], max_chunks: int = 10) -> List[str]:
        chunks = []
        seen = set()
        for doc in docs:
            text = self._normalize_whitespace(getattr(doc, "page_content", ""))
            if not text:
                continue
            signature = text[:180]
            if signature in seen:
                continue
            seen.add(signature)
            chunks.append(text)
            if len(chunks) >= max_chunks:
                break
        return chunks

    def _build_overview(self, chunks: List[str], description: str, language: str) -> str:
        if not chunks:
            if language == "ta":
                return (
                    f"இந்த பகுதி {description} தொடர்பான சட்ட அடிப்படைகள், நடைமுறைகள் மற்றும் முக்கிய ஆவணங்களைப் படிக்க உதவும்."
                )
            return f"This section helps you study legal basics, procedures, and documents related to {description}."

        sentences = self._extract_sentences(" ".join(chunks[:3]))
        if not sentences:
            return chunks[0][:360]

        overview = []
        char_count = 0
        for sentence in sentences:
            if len(sentence) < 40:
                continue
            next_len = char_count + len(sentence)
            if overview and next_len > 360:
                break
            overview.append(sentence)
            char_count = next_len
            if len(overview) >= 2:
                break

        return " ".join(overview) if overview else chunks[0][:360]

    def _build_learn_points(self, chunks: List[str], language: str) -> List[str]:
        candidates = self._extract_sentences(" ".join(chunks[:5]))
        points = []
        seen = set()

        for sentence in candidates:
            text = sentence.strip(" -")
            if len(text) < 45 or len(text) > 220:
                continue
            signature = text.lower()
            if signature in seen:
                continue
            seen.add(signature)
            points.append(text)
            if len(points) >= 3:
                break

        if points:
            return points

        if language == "ta":
            return [
                "இந்த பிரிவின் முக்கிய உரிமைகள் மற்றும் கடமைகளை முதலில் புரிந்துகொள்ளுங்கள்.",
                "விண்ணப்பம் அல்லது வழக்கு தொடர்பான தேவையான ஆவணங்களை பட்டியலிடுங்கள்.",
                "பிரச்சினை ஏற்பட்டால் எந்த அலுவலகம் அல்லது நீதிமன்றத்தை அணுக வேண்டும் என்பதை அறியுங்கள்.",
            ]

        return [
            "Understand the key rights and obligations under this legal category.",
            "Identify required documents and procedural steps before filing.",
            "Know the authority or court to approach if a dispute escalates.",
        ]

    def _build_references(self, docs: List[Any], language: str) -> List[str]:
        refs = []
        seen = set()

        for doc in docs:
            content = self._normalize_whitespace(getattr(doc, "page_content", ""))
            if not content:
                continue
            excerpt = self._build_reference_excerpt(content)
            if not excerpt:
                continue
            signature = excerpt.lower()
            if signature in seen:
                continue
            seen.add(signature)
            refs.append(excerpt)
            if len(refs) >= 5:
                break

        if refs:
            return refs

        if language == "ta":
            return [
                "தமிழ்நாடு சட்ட ஆவண தொகுப்பிலிருந்து தொடர்புடைய பிரிவுகள்",
                "சட்ட நடைமுறை மற்றும் அதிகாரப்பூர்வ வழிகாட்டுதல்கள்",
            ]

        return [
            "Relevant sections from Tamil Nadu legal document corpus",
            "Procedural and official guideline references",
        ]

    def _build_reference_excerpt(self, text: str, max_chars: int = 220) -> str:
        for sentence in self._extract_sentences(text):
            cleaned = sentence.strip(" -")
            if 45 <= len(cleaned) <= max_chars:
                return cleaned

        compact = self._normalize_whitespace(text)
        if not compact:
            return ""
        return compact[:max_chars].rstrip(" ,;:-.")

    def _extract_sentences(self, text: str) -> List[str]:
        clean = self._normalize_whitespace(text)
        if not clean:
            return []
        return [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", clean) if part.strip()]

    def _normalize_whitespace(self, text: str) -> str:
        return re.sub(r"\s+", " ", (text or "")).strip()
