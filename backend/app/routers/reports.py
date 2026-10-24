from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Alert, Encounter, Patient, User
from app.schemas import ReportRequest, ReportResponse
from app.auth import get_current_active_user
from app.services.report_generator import ReportGenerator
from app.agents.orchestrator import RiskMonitoringOrchestrator
from datetime import datetime
import os

router = APIRouter()
report_generator = ReportGenerator()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    report_request: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate PDF report for an alert"""
    # Get alert
    result = await db.execute(select(Alert).where(Alert.id == report_request.alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Get encounter and patient
    encounter_result = await db.execute(
        select(Encounter).where(Encounter.id == alert.encounter_id)
    )
    encounter = encounter_result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    patient_result = await db.execute(
        select(Patient).where(Patient.id == encounter.patient_id)
    )
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Prepare alert data
    alert_data = {
        "encounter_id": alert.encounter_id,
        "risk_scores": {
            "sepsis": {"probability": alert.risk_score},
            "aki": {"probability": 0.0},
            "respiratory_failure": {"probability": 0.0}
        },
        "explanation": {
            "risk_type": alert.risk_type,
            "risk_level": alert.risk_level,
            "evidence_summary": alert.evidence or [],
            "top_drivers": alert.shap_explanations or {},
            "guideline_citations": alert.guideline_citations or [],
            "uncertainty_flags": alert.uncertainty_flags or []
        }
    }
    
    # Prepare patient data
    patient_data = {
        "name": patient.name,
        "mrn": patient.mrn
    }
    
    # Generate report
    report_id = f"RPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    output_path = f"./reports/{report_id}.pdf"
    
    os.makedirs("./reports", exist_ok=True)
    
    await report_generator.generate_report(alert_data, patient_data, output_path)
    
    return {
        "report_path": output_path,
        "report_id": report_id
    }
