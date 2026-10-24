from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Encounter, VitalSign, User
from app.schemas import VitalSignCreate, VitalSignResponse
from app.auth import get_current_active_user
from app.services.ingestion import DataIngestionService

router = APIRouter()
ingestion_service = DataIngestionService()

@router.post("/", response_model=VitalSignResponse)
async def create_vital_sign(
    vital_data: VitalSignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit vital signs data"""
    # Verify encounter exists
    result = await db.execute(
        select(Encounter).where(Encounter.id == vital_data.encounter_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Encounter not found")
    
    # Ingest vital signs
    vital_sign = await ingestion_service.ingest_vitals(
        vital_data.encounter_id,
        vital_data.dict()
    )
    
    return vital_sign

@router.get("/encounter/{encounter_id}")
async def get_vital_signs(
    encounter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get vital signs for an encounter"""
    result = await db.execute(
        select(VitalSign)
        .where(VitalSign.encounter_id == encounter_id)
        .order_by(VitalSign.timestamp.desc())
        .limit(100)
    )
    vitals = result.scalars().all()
    return vitals
