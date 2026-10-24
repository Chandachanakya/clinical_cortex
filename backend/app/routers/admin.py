from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User, Patient, Alert, AuditLog, GuidelineDocument
from app.schemas import AdminStats, AdminUserResponse, AdminGuidelineResponse, AdminAuditResponse
from app.auth import get_current_active_user, get_password_hash

class CreateUserRequest(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    role: str = "doctor"

router = APIRouter()

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get high-level system statistics for Admin Dashboard"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Total Users
    user_count_result = await db.execute(select(func.count(User.id)))
    total_users = user_count_result.scalar()
    
    # User Distribution
    dist_result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    user_distribution = [{"role": r.role, "count": r[1]} for r in dist_result.all()]
    
    # Active Alerts
    alert_count_result = await db.execute(select(func.count(Alert.id)).where(Alert.status == "pending"))
    active_alerts = alert_count_result.scalar()
    
    # Audit Events
    audit_count_result = await db.execute(select(func.count(AuditLog.id)))
    audit_events = audit_count_result.scalar()
    
    return {
        "total_users": total_users,
        "user_distribution": user_distribution,
        "active_alerts": active_alerts,
        "system_health": 99.8,  # Mocked for now
        "audit_events": audit_events
    }

@router.post("/users", response_model=AdminUserResponse)
async def create_user(
    user_data: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check for duplicate username or email
    existing = await db.execute(select(User).where(
        (User.username == user_data.username) |
        (User.email == user_data.email if user_data.email else False)
    ))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    new_user = User(
        username=user_data.username.strip(),
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),  # bcrypt — same as login
        role=user_data.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.get("/guidelines", response_model=List[AdminGuidelineResponse])
async def get_all_guidelines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(GuidelineDocument).order_by(GuidelineDocument.uploaded_at.desc()))
    return result.scalars().all()

@router.get("/audit", response_model=List[AdminAuditResponse])
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100))
    logs = result.scalars().all()
    
    # Flatten logs for response
    return [{
        "id": l.id,
        "timestamp": l.timestamp,
        "event_type": l.event_type,
        "agent_name": l.agent_name,
        "details": f"Model: {l.model_version}"
    } for l in logs]
