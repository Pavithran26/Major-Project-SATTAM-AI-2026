from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from app.config import settings

class VectorDatabase:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL
        )
        self.vector_store = Chroma(
            persist_directory=settings.VECTOR_DB_PATH,
            embedding_function=self.embeddings
        )
    
    def add_documents(self, documents):
        """Add documents to vector store"""
        self.vector_store.add_documents(documents)
        self.vector_store.persist()
    
    def search(self, query, k=5):
        """Search for similar documents"""
        return self.vector_store.similarity_search(query, k=k)
    
    def delete_all(self):
        """Clear vector store"""
        self.vector_store.delete_collection()