from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import Alert, User
from app.schemas import AlertResponse, AlertUpdate
from app.auth import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    encounter_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get alerts with optional filters"""
    query = select(Alert)
    
    if encounter_id:
        query = query.where(Alert.encounter_id == encounter_id)
    if status:
        query = query.where(Alert.status == status)
    
    query = query.order_by(Alert.timestamp.desc()).limit(100)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    return alerts

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update alert status and feedback"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = alert_update.status
    if alert_update.feedback:
        alert.feedback = alert_update.feedback
    alert.reviewed_by = current_user.id
    alert.reviewed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(alert)
    return alert
