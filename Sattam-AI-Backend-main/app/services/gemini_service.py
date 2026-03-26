from typing import List, Dict, Any, Optional
import re

from openai import OpenAI

from app.config import settings


class GeminiService:
    """
    Legacy class name kept for compatibility.
    Internally this now uses an OpenAI-compatible client (e.g. Cloudflare AI Gateway).
    """

    _TAMIL_TEXT_PATTERN = re.compile(r"[\u0B80-\u0BFF]")

    @staticmethod
    def _uses_google_provider(model_name: str) -> bool:
        normalized = (model_name or "").strip().lower()
        return normalized.startswith("google-ai-studio/") or normalized.startswith("google/")

    @staticmethod
    def _normalize_provider(provider_value: str) -> str:
        normalized = (provider_value or "").strip().lower()
        if normalized in ("google", "gemini"):
            return "google"
        if normalized == "openai":
            return "openai"
        return "auto"

    def __init__(self):
        self.base_url: Optional[str] = settings.OPENAI_BASE_URL
        requested_provider = self._normalize_provider(settings.LLM_PROVIDER)
        self.openai_model_name: str = settings.OPENAI_MODEL
        self.google_model_name: str = settings.GOOGLE_MODEL

        if requested_provider == "google":
            self.provider = "google"
            self.model_name = self.google_model_name
        elif requested_provider == "openai":
            self.provider = "openai"
            self.model_name = self.openai_model_name
        else:
            # Backward-compatible auto mode: infer provider from OPENAI_MODEL.
            self.model_name = self.openai_model_name
            self.provider = "google" if self._uses_google_provider(self.model_name) else "openai"

        # With AI Gateway, provider key depends on routed provider/model.
        # Use Gemini key for Google routes; otherwise default to OpenAI key.
        if self.base_url:
            if self.provider == "google":
                self.api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
            else:
                self.api_key = settings.OPENAI_API_KEY or settings.GEMINI_API_KEY
        else:
            self.api_key = settings.OPENAI_API_KEY or settings.GEMINI_API_KEY

        self.client: Optional[OpenAI] = None
        if self.api_key:
            client_kwargs: Dict[str, Any] = {"api_key": self.api_key}
            if self.base_url:
                client_kwargs["base_url"] = self.base_url
            self.client = OpenAI(**client_kwargs)

        self.legal_system_prompt = """
You are a Tamil Nadu legal assistant.
You provide legal information (not legal representation) with clear, practical steps.

Rules:
1. Stay on Tamil Nadu / Indian legal scope only.
2. If user asks non-legal topic, politely redirect to legal guidance.
3. Do not invent section numbers; if unsure, say "not available in provided context".
4. Keep response practical, clear, and well-structured.
5. Prefer useful detail over excessive brevity when the user asks for guidance.
        """.strip()

    def _active_api_key_env_name(self) -> str:
        return "GEMINI_API_KEY" if self.provider == "google" else "OPENAI_API_KEY"

    def _active_model_env_name(self) -> str:
        return "GOOGLE_MODEL" if self.provider == "google" else "OPENAI_MODEL"

    def _response_style_prompt(self, language: str) -> str:
        if language == "ta":
            return """
பதில் வடிவம் (கண்டிப்பாக):
சுருக்கமான பதில்:
- 2 அல்லது 3 குறுகிய புள்ளிகள் (ஒவ்வொரு புள்ளியும் 16 சொற்களுக்குள்)

சட்ட அடிப்படை:
- பொருந்தும் சட்டம்/பிரிவு (தெரியாவிட்டால்: "கிடைத்த உள்ளடக்கத்தில் இல்லை")

அடுத்த படிகள்:
1) நடைமுறை அடுத்த செயல்
2) தேவையான ஆவணங்கள்
3) எந்த அலுவலகம்/நீதிமன்றம் அணுக வேண்டும்

வரம்பு குறிப்பு:
- "இது தகவல் உதவி மட்டுமே; இறுதி ஆலோசனைக்கு வழக்கறிஞரை அணுகவும்."

குறிப்பு: முழுப் பதிலும் தமிழ் எழுத்தில் இருக்க வேண்டும் (சட்டப் பெயர்/எண் தவிர).
மொத்த நீளம் 120 முதல் 140 சொற்களுக்குள் இருக்க வேண்டும்.
மேலுள்ள 4 தலைப்புகள் தவிர கூடுதல் தலைப்புகள் இட வேண்டாம்.
            """.strip()
        return """
Response format:
Short Answer:
- 2 to 3 clear bullets

Legal Basis:
- Applicable law/section (or "not available in provided context")

Detailed Explanation:
- Write 2 or 3 practical paragraphs tailored to the user's situation
- Explain rights, risks, process, and what usually happens next when relevant

Next Steps:
1) Immediate action
2) Documents to collect
3) Where to file/approach

Important Note:
- "This is informational guidance, not a final legal opinion."
Do not make the answer overly brief.
Target about 250 to 450 words unless the question is very simple.
        """.strip()

    def _contains_tamil_text(self, text: str) -> bool:
        return bool(self._TAMIL_TEXT_PATTERN.search(text or ""))

    def _extract_message_text(self, completion: Any) -> str:
        if not completion.choices:
            return ""
        message = completion.choices[0].message
        return (message.content or "").strip()

    def _translate_to_tamil_if_needed(self, text: str) -> str:
        if not text.strip() or self.client is None:
            return text
        if self._contains_tamil_text(text):
            return text

        try:
            translation = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Translate the following legal guidance to natural Tamil. "
                            "Keep structure and meaning unchanged. Output only Tamil text."
                        ),
                    },
                    {"role": "user", "content": text},
                ],
                temperature=0.0,
                max_tokens=min(max(settings.LLM_MAX_TOKENS, 1400), 1800),
            )
            translated = self._extract_message_text(translation)
            if translated and self._contains_tamil_text(translated):
                return translated
        except Exception:
            pass

        return (
            "தமிழில் முழுப் பதிலை உருவாக்க முடியவில்லை. கீழே கிடைத்த பதில்:\n\n"
            f"{text}"
        )

    def _compact_mobile_answer(self, text: str) -> str:
        normalized = (text or "").replace("\r\n", "\n").strip()
        if not normalized:
            return normalized

        normalized = re.sub(r"[ \t]+", " ", normalized)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()

    def generate_response(self, query: str, context: List[str] = None, language: str = "en") -> Dict[str, Any]:
        """Generate response using OpenAI-compatible chat completion with RAG context."""
        context = context or []
        response_language = "ta" if str(language).lower().startswith("ta") else "en"

        try:
            if self.client is None:
                raise RuntimeError(
                    f"Missing API key. Set {self._active_api_key_env_name()} "
                    "(fallback keys are also supported)."
                )

            context_text = "\n\n".join(context) if context else "(No strong context retrieved.)"
            style_prompt = self._response_style_prompt(response_language)
            user_prompt = f"""
Required response language: {"Tamil" if response_language == "ta" else "English"}.
Always answer in {"Tamil" if response_language == "ta" else "English"} regardless of the input question language.

{style_prompt}

Context from Tamil Nadu legal documents:
{context_text}

User question:
{query}

If question is not legal, reply briefly and ask the user to ask a legal question.
            """.strip()

            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": self.legal_system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=min(max(settings.LLM_MAX_TOKENS, 1400), 1800),
            )

            response_text = self._extract_message_text(completion)
            if not response_text:
                response_text = (
                    "No answer was returned by the model. Please try rephrasing your legal question."
                    if response_language == "en"
                    else "மாடல் பதில் தரவில்லை. தயவுசெய்து உங்கள் சட்ட கேள்வியை வேறுபடி எழுதி முயற்சிக்கவும்."
                )

            if response_language == "ta":
                response_text = self._translate_to_tamil_if_needed(response_text)

            response_text = self._compact_mobile_answer(response_text)

            return {
                "response": response_text,
                "sources": context,
                "model": self.model_name,
            }

        except Exception as e:
            error_text = str(e)
            fallback = self._build_fallback_response(query, context, error_text, response_language)
            error_lc = error_text.lower()
            quota_or_rate_limited = (
                "quota" in error_lc
                or "429" in error_lc
                or "resourceexhausted" in error_lc
                or "rate limit" in error_lc
            )
            auth_or_config_error = (
                "missing api key" in error_lc
                or "api key is missing" in error_lc
                or "401" in error_lc
                or "authentication" in error_lc
                or "invalid api key" in error_lc
                or "unauthorized" in error_lc
            )
            return {
                "error": error_text,
                "response": fallback,
                "sources": [] if (quota_or_rate_limited or auth_or_config_error) else context,
            }

    def stream_response(self, query: str, context: List[str] = None):
        """Streaming not implemented in this backend."""
        pass

    def _build_fallback_response(self, query: str, context: List[str], error_text: str, language: str = "en") -> str:
        """Return a helpful answer when model API call fails."""
        is_tamil = str(language).lower().startswith("ta")
        error_lc = (error_text or "").lower()

        if (
            "quota" in error_lc
            or "429" in error_lc
            or "resourceexhausted" in error_lc
            or "rate limit" in error_lc
        ):
            if is_tamil:
                return (
                    "LLM quota தற்போது முடிந்துள்ளது.\n"
                    "- காரணம்: API பயன்பாட்டு வரம்பு முடிந்தது.\n"
                    "- சரி செய்ய: billing/quota புதுப்பிக்கவும் அல்லது புதிய API key பயன்படுத்தவும்.\n"
                    "- பிறகு மீண்டும் முயற்சிக்கவும்."
                )
            return (
                "LLM quota is exceeded right now.\n"
                "- Reason: API usage limit is reached.\n"
                "- Fix: update billing/quota or use a new API key.\n"
                "- Then try again."
            )

        if (
            "missing api key" in error_lc
            or "api key is missing" in error_lc
            or "401" in error_lc
            or "authentication" in error_lc
            or "invalid api key" in error_lc
            or "unauthorized" in error_lc
        ):
            key_env = self._active_api_key_env_name()
            model_env = self._active_model_env_name()
            if is_tamil:
                return (
                    "API key செல்லுபடியாக இல்லை அல்லது அனுமதி இல்லை.\n"
                    f"- {key_env} மதிப்பை சரிபார்க்கவும்.\n"
                    f"- {model_env} மற்றும் OPENAI_BASE_URL அமைப்புகள் சரியாக உள்ளதா பார்க்கவும்.\n"
                    "- புதுப்பித்த பின் backend-ஐ restart செய்யவும்."
                )
            return (
                "API key is invalid or unauthorized.\n"
                f"- Check {key_env}.\n"
                f"- Verify {model_env} and OPENAI_BASE_URL configuration.\n"
                "- Restart backend after updating .env."
            )

        if context:
            top_chunks = [chunk.strip() for chunk in context[:2] if chunk and chunk.strip()]
            if top_chunks:
                excerpts = []
                for chunk in top_chunks:
                    compact = " ".join(chunk.split())
                    if len(compact) > 320:
                        compact = f"{compact[:317]}..."
                    excerpts.append(compact)
                excerpt_text = "\n\n".join(excerpts)
                if is_tamil:
                    return (
                        "AI பதில் சேவை தற்போது கிடைக்கவில்லை. கிடைத்த சட்ட குறிப்புகளின் சுருக்கம்:\n\n"
                        f"கேள்வி: {query}\n\n"
                        f"தொடர்புடைய பகுதிகள்:\n{excerpt_text}\n\n"
                        "சட்ட நடவடிக்கைக்கு முன் தகுதியான வழக்கறிஞரிடம் உறுதிப்படுத்தவும்."
                    )
                return (
                    "AI generation is currently unavailable. Here is a short extract from retrieved legal text:\n\n"
                    f"Question: {query}\n\n"
                    f"Relevant excerpts:\n{excerpt_text}\n\n"
                    "Please verify with an advocate before taking legal action."
                )

        if is_tamil:
            key_env = self._active_api_key_env_name()
            model_env = self._active_model_env_name()
            return (
                "AI பதில் சேவை தற்போது கிடைக்கவில்லை.\n"
                f"- {key_env}, OPENAI_BASE_URL, {model_env} அமைப்புகளை சரிபார்க்கவும்.\n"
                "- Network அணுகலை சரிபார்த்து backend-ஐ restart செய்யவும்."
            )

        key_env = self._active_api_key_env_name()
        model_env = self._active_model_env_name()
        return (
            "AI generation is currently unavailable.\n"
            f"- Check {key_env}, OPENAI_BASE_URL, and {model_env}.\n"
            "- Verify network access and restart the backend."
        )
