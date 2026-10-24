import pytest
from datetime import datetime, timedelta
from app.agents.safety_layer import SafetyLayer

@pytest.fixture
def safety_layer():
    return SafetyLayer()

@pytest.mark.asyncio
async def test_data_completeness_check(safety_layer):
    # Complete vitals
    complete_vitals = [{
        "timestamp": datetime.utcnow(),
        "heart_rate": 80,
        "respiratory_rate": 16,
        "spo2": 97,
        "temperature": 37,
        "mean_arterial_pressure": 85
    }]
    
    risk_scores = {
        "sepsis": {"probability": 0.7, "level": "HIGH"},
        "aki": {"probability": 0.3, "level": "LOW"},
        "respiratory_failure": {"probability": 0.4, "level": "MEDIUM"}
    }
    
    explanation = {
        "risk_level": "HIGH",
        "risk_type": "sepsis",
        "evidence_summary": [],
        "guideline_citations": [],
        "uncertainty_flags": []
    }
    
    result = await safety_layer.validate(complete_vitals, risk_scores, explanation)
    
    assert result["should_alert"] == True
    assert result["data_coverage"] == 1.0
    assert result["blocked"] == False

@pytest.mark.asyncio
async def test_incomplete_data_blocks_alert(safety_layer):
    # Incomplete vitals (only 2 of 5 fields)
    incomplete_vitals = [{
        "timestamp": datetime.utcnow(),
        "heart_rate": 80,
        "respiratory_rate": 16
    }]
    
    risk_scores = {
        "sepsis": {"probability": 0.9, "level": "CRITICAL"}
    }
    
    explanation = {
        "risk_level": "CRITICAL",
        "risk_type": "sepsis",
        "evidence_summary": [],
        "guideline_citations": [],
        "uncertainty_flags": []
    }
    
    result = await safety_layer.validate(incomplete_vitals, risk_scores, explanation)
    
    assert result["data_coverage"] < 0.6
    assert result["should_alert"] == False  # Blocked due to low coverage

@pytest.mark.asyncio
async def test_stale_data_blocks_alert(safety_layer):
    # Stale vitals (2 hours old)
    stale_vitals = [{
        "timestamp": datetime.utcnow() - timedelta(hours=2),
        "heart_rate": 80,
        "respiratory_rate": 16,
        "spo2": 97,
        "temperature": 37,
        "mean_arterial_pressure": 85
    }]
    
    risk_scores = {
        "sepsis": {"probability": 0.9, "level": "CRITICAL"}
    }
    
    explanation = {
        "risk_level": "CRITICAL",
        "risk_type": "sepsis",
        "evidence_summary": [],
        "guideline_citations": [],
        "uncertainty_flags": []
    }
    
    result = await safety_layer.validate(stale_vitals, risk_scores, explanation)
    
    assert result["data_staleness_minutes"] > 60
    assert result["blocked"] == True
