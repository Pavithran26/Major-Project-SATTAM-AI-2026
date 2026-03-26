from sentence_transformers import SentenceTransformer
from app.config import Config

class EmbeddingModel:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')  # Example model

    def encode(self, texts: list):
        return self.model.encode(texts).tolist()
