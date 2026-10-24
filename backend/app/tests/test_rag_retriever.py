import pytest
from app.agents.rag_retriever import RAGRetriever

@pytest.fixture
def rag_retriever():
    return RAGRetriever()

@pytest.mark.asyncio
async def test_guideline_retrieval(rag_retriever):
    query_terms = ["heart_rate", "temperature", "sepsis"]
    risk_scores = {
        "sepsis": {"probability": 0.7, "level": "HIGH"},
        "aki": {"probability": 0.3, "level": "LOW"}
    }
    
    guidelines = await rag_retriever.retrieve_guidelines(query_terms, risk_scores)
    
    assert len(guidelines) > 0
    assert "title" in guidelines[0]
    assert "source" in guidelines[0]
