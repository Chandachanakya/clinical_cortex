import chromadb
from chromadb.config import Settings
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from typing import List, Dict
from app.config import settings
import os

# Use a local embedding function — no internet download required
_LOCAL_EF = DefaultEmbeddingFunction()


class RAGRetriever:
    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.collection = self._get_or_create_collection()

    def _get_or_create_collection(self):
        """Get or create ChromaDB collection for guidelines (local embeddings)."""
        try:
            return self.client.get_collection(
                "clinical_guidelines",
                embedding_function=_LOCAL_EF
            )
        except Exception:
            return self.client.create_collection(
                name="clinical_guidelines",
                embedding_function=_LOCAL_EF,
                metadata={"description": "Hospital/NICE/WHO guidelines"}
            )

    async def retrieve_guidelines(self, query_terms: List[str], risk_scores: Dict) -> List[Dict]:
        """
        Retrieve relevant guideline sections based on risk type and SHAP features
        """
        # Filter to only look at risk type dictionaries (skip 'timestamp' string)
        risk_entries = {k: v for k, v in risk_scores.items() if isinstance(v, dict)}
        
        # Determine primary risk type
        if not risk_entries:
            primary_risk = "sepsis"  # Default
        else:
            primary_risk = max(risk_entries.items(), key=lambda x: x[1].get("probability", 0))[0]
        
        # Build query
        query = f"{primary_risk} {' '.join(query_terms)}"
        
        # Retrieve from ChromaDB
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=3
            )
            
            guidelines = []
            if results and results.get('documents') and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results.get('metadatas') and results['metadatas'] else {}
                    distance = results['distances'][0][i] if results.get('distances') and results['distances'] else 0.5
                    guidelines.append({
                        "title": metadata.get("title", "Clinical Guideline"),
                        "source": metadata.get("source", "Hospital"),
                        "section": metadata.get("section", "General"),
                        "excerpt": doc[:300] if doc else "",  # First 300 chars
                        "version": metadata.get("version", "1.0"),
                        "relevance_score": float(1.0 - distance) if distance < 1.0 else 0.8
                    })
        except Exception as e:
            print(f"Error retrieving guidelines: {e}")
            guidelines = []
        
        # If no results, return default guidelines
        if not guidelines:
            guidelines = self._get_default_guidelines(primary_risk)
        
        return guidelines
    
    def _get_default_guidelines(self, risk_type: str) -> List[Dict]:
        """Fallback guidelines when RAG retrieval fails"""
        defaults = {
            "sepsis": {
                "title": "NICE Guideline NG51",
                "source": "NICE",
                "section": "Recognition and early assessment",
                "excerpt": "High-risk criteria include: HR >130, RR >25, systolic BP <90, lactate >2 mmol/L. Consider sepsis if infection suspected with 2+ SIRS criteria.",
                "version": "2021"
            },
            "aki": {
                "title": "KDIGO AKI Guidelines",
                "source": "KDIGO",
                "section": "AKI Definition and Staging",
                "excerpt": "AKI defined by: Cr increase ≥0.3 mg/dL within 48h, or Cr increase ≥1.5x baseline within 7 days, or urine output <0.5 mL/kg/h for 6h.",
                "version": "2012"
            },
            "respiratory_failure": {
                "title": "WHO Clinical Management Guidelines",
                "source": "WHO",
                "section": "Oxygen Therapy",
                "excerpt": "Initiate oxygen if SpO2 <90%. Target SpO2 ≥94%. Monitor respiratory rate, work of breathing. Consider escalation if deteriorating.",
                "version": "2020"
            }
        }
        
        guideline = defaults.get(risk_type, defaults["sepsis"])
        guideline["relevance_score"] = 0.7
        return [guideline]
    
    def index_guideline_document(self, doc_id: str, title: str, source: str, 
                                 sections: List[Dict]):
        """Index a new guideline document into ChromaDB"""
        documents = []
        metadatas = []
        ids = []
        
        for i, section in enumerate(sections):
            documents.append(section["content"])
            metadatas.append({
                "title": title,
                "source": source,
                "section": section["title"],
                "version": section.get("version", "1.0")
            })
            ids.append(f"{doc_id}_section_{i}")
        
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
