from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Patient, Encounter, User, Alert
from app.schemas import PatientCreate, PatientResponse, EncounterCreate, EncounterResponse, PatientMonitorResponse
from app.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[PatientMonitorResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all patients with latest monitoring data"""
    query = select(Patient).where(Patient.status == "active")
    result = await db.execute(query)
    patients = result.scalars().all()
    
    response = []
    for p in patients:
        # Get latest encounter
        enc_result = await db.execute(
            select(Encounter).where(Encounter.patient_id == p.id, Encounter.status == "active").order_by(Encounter.admission_datetime.desc())
        )
        enc = enc_result.scalar_one_or_none()
        
        # Get latest alert/risk
        alert_result = await db.execute(
            select(Alert).where(Alert.encounter_id == (enc.id if enc else None)).order_by(Alert.timestamp.desc())
        )
        latest_alert = alert_result.scalars().first()
        
        response.append({
            "id": p.id,
            "mrn": p.mrn,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "ward": enc.ward if enc else None,
            "bed": enc.bed if enc else None,
            "risk_level": latest_alert.risk_level if latest_alert else "LOW",
            "risk_types": [latest_alert.risk_type] if latest_alert else [],
            "last_vitals_update": latest_alert.timestamp if latest_alert else None,
            "status": p.status,
            "q_sofa_score": latest_alert.evidence.get("qsofa", 0) if latest_alert and isinstance(latest_alert.evidence, dict) else 0,
            "news2_score": latest_alert.evidence.get("news2", 0) if latest_alert and isinstance(latest_alert.evidence, dict) else 0
        })
    return response

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new patient"""
    # Check if MRN already exists
    result = await db.execute(select(Patient).where(Patient.mrn == patient_data.mrn))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="MRN already exists")
    
    new_patient = Patient(**patient_data.dict())
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)
    
    return new_patient

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get patient by ID"""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/{patient_id}/monitor", response_model=PatientMonitorResponse)
async def get_patient_monitor(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single patient's real-time monitoring data (risk level, ward, etc.)"""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    enc_result = await db.execute(
        select(Encounter).where(Encounter.patient_id == p.id, Encounter.status == "active")
            .order_by(Encounter.admission_datetime.desc())
    )
    enc = enc_result.scalar_one_or_none()

    alert_result = await db.execute(
        select(Alert).where(Alert.encounter_id == (enc.id if enc else None))
            .order_by(Alert.timestamp.desc())
    )
    latest_alert = alert_result.scalars().first()

    return {
        "id": p.id,
        "mrn": p.mrn,
        "name": p.name,
        "age": p.age,
        "gender": p.gender,
        "ward": enc.ward if enc else None,
        "bed": enc.bed if enc else None,
        "risk_level": latest_alert.risk_level if latest_alert else "LOW",
        "risk_types": [latest_alert.risk_type] if latest_alert else [],
        "last_vitals_update": latest_alert.timestamp if latest_alert else None,
        "status": p.status,
        "q_sofa_score": latest_alert.evidence.get("qsofa", 0) if latest_alert and isinstance(latest_alert.evidence, dict) else 0,
        "news2_score": latest_alert.evidence.get("news2", 0) if latest_alert and isinstance(latest_alert.evidence, dict) else 0
    }


@router.get("/{patient_id}/predictions")
async def get_patient_predictions(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Return the latest ML prediction output for a patient:
    - Per-condition risk scores (Sepsis, AKI, Respiratory Failure)
    - SHAP feature importance values
    - NEWS2 / qSOFA clinical scores
    - Guideline citations
    - Uncertainty flags
    This is sourced from the most recent Alert record saved by the orchestrator.
    """
    # Get patient
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get active encounter
    enc_result = await db.execute(
        select(Encounter)
        .where(Encounter.patient_id == p.id, Encounter.status == "active")
        .order_by(Encounter.admission_datetime.desc())
    )
    enc = enc_result.scalar_one_or_none()

    if not enc:
        return {"available": False, "reason": "No active encounter"}

    # Get all recent alerts for this encounter to build per-risk breakdown
    alerts_result = await db.execute(
        select(Alert)
        .where(Alert.encounter_id == enc.id)
        .order_by(Alert.timestamp.desc())
        .limit(20)
    )
    alerts = alerts_result.scalars().all()

    if not alerts:
        return {"available": False, "reason": "No predictions generated yet"}

    latest = alerts[0]

    # Build per-condition risk scores from all recent alerts
    risk_breakdown = {}
    seen_types = set()
    for alert in alerts:
        rt = (alert.risk_type or "").lower().replace(" ", "_")
        if rt and rt not in seen_types:
            seen_types.add(rt)
            risk_breakdown[rt] = {
                "probability": alert.risk_score or 0.0,
                "level": alert.risk_level or "LOW",
                "risk_type": alert.risk_type,
                "timestamp": alert.timestamp.isoformat() if alert.timestamp else None,
            }

    # SHAP explanations stored by orchestrator
    shap_data = latest.shap_explanations or {}

    # Evidence block (NEWS2, qSOFA, vitals summary)
    # Guard: evidence is stored as JSON — could be a dict or a list depending on orchestrator version
    raw_evidence = latest.evidence or {}
    evidence = raw_evidence if isinstance(raw_evidence, dict) else {}

    return {
        "available": True,
        "patient_id": patient_id,
        "encounter_id": enc.id,
        "last_updated": latest.timestamp.isoformat() if latest.timestamp else None,
        "overall_risk_level": latest.risk_level,
        "overall_risk_score": latest.risk_score or 0.0,
        "primary_risk_type": latest.risk_type,
        "risk_breakdown": risk_breakdown,
        "shap_explanations": shap_data,
        "clinical_scores": {
            "news2": evidence.get("news2", 0),
            "qsofa": evidence.get("qsofa", 0),
            "vitals_summary": evidence.get("vitals_summary", {}),
        },
        "guideline_citations": latest.guideline_citations or [],
        "uncertainty_flags": latest.uncertainty_flags or [],
    }


@router.post("/{patient_id}/encounters", response_model=EncounterResponse)
async def create_encounter(
    patient_id: int,
    encounter_data: EncounterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new encounter for a patient"""
    # Verify patient exists
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_encounter = Encounter(
        patient_id=patient_id,
        **encounter_data.dict()
    )
    db.add(new_encounter)
    await db.commit()
    await db.refresh(new_encounter)
    
    return new_encounter

@router.get("/{patient_id}/encounters")
async def get_patient_encounters(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all encounters for a patient"""
    result = await db.execute(
        select(Encounter).where(Encounter.patient_id == patient_id)
    )
    encounters = result.scalars().all()
    return encounters
