"""
Demo scenario router for Clinical Cortex prototype demonstrations.
POST /api/demo/trigger  — fires a scripted critical patient alert
                          and sends a WhatsApp message via Twilio.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_active_user
from app.models import User
from app.services.twilio_service import send_whatsapp_alert
import asyncio, random
from datetime import datetime

router = APIRouter()

# ─────────────────────────────────────────────
#  Scripted demo scenarios
# ─────────────────────────────────────────────
DEMO_SCENARIOS = [
    {
        "id": "sepsis_critical",
        "title": "Critical Sepsis Alert",
        "description": "Rajesh Kumar (ICU-A) shows rapid deterioration — qSOFA 3, NEWS2 11. Sepsis risk score 91%.",
        "patient_name": "Rajesh Kumar",
        "risk_level": "CRITICAL",
        "risk_type": "Sepsis",
        "risk_score": 0.91,
        "ward": "ICU-A",
        "bed": "12",
        "vitals_summary": "HR 128 bpm · SpO₂ 88% · Temp 39.4°C · BP 85/50 mmHg",
        "q_sofa": 3,
        "news2": 11,
    },
    {
        "id": "aki_high",
        "title": "High AKI Risk Alert",
        "description": "Priya Patel (Ward-2A) — creatinine rising 1.8× baseline. AKI risk score 74%.",
        "patient_name": "Priya Patel",
        "risk_level": "HIGH",
        "risk_type": "Acute Kidney Injury",
        "risk_score": 0.74,
        "ward": "Ward-2A",
        "bed": "15",
        "vitals_summary": "Urine output 0.4 mL/kg/hr · Creatinine 2.1 mg/dL · eGFR 34",
        "q_sofa": 1,
        "news2": 7,
    },
    {
        "id": "respiratory_failure",
        "title": "Respiratory Failure Warning",
        "description": "Vikram Singh (ICU-B) — FiO₂ requirements rising. Respiratory Failure risk 82%.",
        "patient_name": "Vikram Singh",
        "risk_level": "CRITICAL",
        "risk_type": "Respiratory Failure",
        "risk_score": 0.82,
        "ward": "ICU-B",
        "bed": "03",
        "vitals_summary": "SpO₂ 84% on 60% FiO₂ · RR 32 /min · PaO₂/FiO₂ 180",
        "q_sofa": 2,
        "news2": 9,
    },
]


class DemoTriggerRequest(BaseModel):
    scenario_id: Optional[str] = "sepsis_critical"   # which scenario to fire
    to_phone: str                                      # recipient WhatsApp number e.g. +919876543210
    doctor_name: Optional[str] = "Doctor"


class DemoTriggerResponse(BaseModel):
    success: bool
    scenario: dict
    whatsapp_result: dict
    timestamp: str
    steps: list


@router.get("/scenarios")
async def list_scenarios():
    """List all available demo scenarios"""
    return DEMO_SCENARIOS


@router.post("/trigger", response_model=DemoTriggerResponse)
async def trigger_demo(
    req: DemoTriggerRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Fire a scripted clinical alert scenario and send a WhatsApp notification.
    Simulates the full pipeline: risk detection → alert generation → WhatsApp dispatch.
    """

    # Find the requested scenario
    scenario = next((s for s in DEMO_SCENARIOS if s["id"] == req.scenario_id), DEMO_SCENARIOS[0])

    # Simulate a multi-step pipeline with small delays (for demo effect)
    steps = []

    # Step 1: Risk model evaluation (simulated)
    await asyncio.sleep(0.3)
    steps.append({
        "step": 1,
        "label": "Risk Model Evaluated",
        "detail": f"XGBoost model computed risk score: {int(scenario['risk_score'] * 100)}%",
        "status": "completed",
    })

    # Step 2: qSOFA/NEWS2 assessment
    await asyncio.sleep(0.2)
    steps.append({
        "step": 2,
        "label": "Clinical Scores Calculated",
        "detail": f"qSOFA: {scenario['q_sofa']} · NEWS2: {scenario['news2']}",
        "status": "completed",
    })

    # Step 3: Alert generation
    await asyncio.sleep(0.2)
    steps.append({
        "step": 3,
        "label": "Alert Generated",
        "detail": f"{scenario['risk_level']} alert created for {scenario['patient_name']}",
        "status": "completed",
    })

    # Step 4: WhatsApp dispatch
    whatsapp_result = await send_whatsapp_alert(
        to_phone=req.to_phone,
        patient_name=scenario["patient_name"],
        risk_level=scenario["risk_level"],
        risk_type=scenario["risk_type"],
        risk_score=scenario["risk_score"],
        ward=scenario["ward"],
        bed=scenario["bed"],
        doctor_name=req.doctor_name,
    )

    # If Twilio failed, raise HTTP 500 so the frontend catch block sees it
    if whatsapp_result.get("status") == "error":
        raise HTTPException(
            status_code=500,
            detail=f"WhatsApp delivery failed: {whatsapp_result.get('error', 'Unknown Twilio error')}"
        )

    steps.append({
        "step": 4,
        "label": "WhatsApp Notification Dispatched",
        "detail": f"Message sent to {req.to_phone} via Twilio",
        "status": "completed",
    })

    print(f"[Demo] Scenario '{scenario['id']}' triggered by {current_user.username} at {datetime.now()}")

    return {
        "success": True,
        "scenario": scenario,
        "whatsapp_result": whatsapp_result,
        "timestamp": datetime.now().isoformat(),
        "steps": steps,
    }
