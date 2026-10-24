import pytest
from app.agents.risk_predictor import RiskPredictor

@pytest.fixture
def risk_predictor():
    return RiskPredictor()

@pytest.mark.asyncio
async def test_risk_prediction_with_vitals(risk_predictor):
    vitals = [{
        "heart_rate": 110,
        "respiratory_rate": 24,
        "spo2": 93,
        "temperature": 38.5,
        "mean_arterial_pressure": 75
    }]
    
    labs = {}
    trends = {
        "hr_slope": 2.0,
        "map_slope": -1.5,
        "rr_slope": 1.0
    }
    
    result = await risk_predictor.predict_risk(vitals, labs, trends)
    
    assert "sepsis" in result
    assert "aki" in result
    assert "respiratory_failure" in result
    assert result["sepsis"]["probability"] >= 0.0
    assert result["sepsis"]["probability"] <= 1.0

@pytest.mark.asyncio
async def test_risk_prediction_empty_vitals(risk_predictor):
    result = await risk_predictor.predict_risk([], {}, {})
    
    assert result["sepsis"]["probability"] == 0.0
    assert result["sepsis"]["level"] == "LOW"
