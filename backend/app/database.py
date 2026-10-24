from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
from app.models import Base
from typing import AsyncGenerator
from sqlalchemy import select
from app.models import Encounter, VitalSign, Alert
from datetime import datetime, timedelta

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
    pool_timeout=30
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_active_encounters():
    """Get all active encounters"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Encounter).where(Encounter.status == "active")
        )
        return result.scalars().all()

async def get_recent_vitals(encounter_id: int, hours: int = 24) -> list:
    """Get recent vitals for an encounter"""
    async with AsyncSessionLocal() as session:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        result = await session.execute(
            select(VitalSign)
            .where(VitalSign.encounter_id == encounter_id)
            .where(VitalSign.timestamp >= cutoff)
            .order_by(VitalSign.timestamp.desc())
        )
        vitals = result.scalars().all()
        return [
            {
                "timestamp": v.timestamp.isoformat() if isinstance(v.timestamp, datetime) else v.timestamp,
                "heart_rate": v.heart_rate,
                "systolic_bp": v.systolic_bp,
                "diastolic_bp": v.diastolic_bp,
                "mean_arterial_pressure": v.mean_arterial_pressure,
                "respiratory_rate": v.respiratory_rate,
                "spo2": v.spo2,
                "temperature": v.temperature
            }
            for v in vitals
        ]

async def save_alert(encounter_id: int, risk_data: dict, explanation: dict = None, shap_data: dict = None):
    """Persist AI assessment to Alert table"""
    async with AsyncSessionLocal() as session:
        # Determine primary risk type and level
        # risk_data contains {sepsis: {level, probability}, aki: ..., resp: ...}
        primary_risk_type = "Multiple"
        max_prob = -1.0
        primary_level = "LOW"
        
        for r_type, data in risk_data.items():
            if isinstance(data, dict) and data.get("probability", 0) > max_prob:
                max_prob = data["probability"]
                primary_risk_type = r_type.replace("_", " ").title()
                primary_level = data.get("level", "LOW")

        new_alert = Alert(
            encounter_id=encounter_id,
            timestamp=datetime.utcnow(),
            risk_type=primary_risk_type,
            risk_level=primary_level,
            risk_score=max_prob,
            evidence=explanation.get("evidence_summary") if explanation else {},
            guideline_citations=explanation.get("guideline_citations") if explanation else [],
            shap_explanations=shap_data if shap_data else {},
            status="pending"
        )
        session.add(new_alert)
        await session.commit()
        print(f"[Database] Saved alert {new_alert.id} for Encounter {encounter_id} (Level: {primary_level})")
        return new_alert

async def get_latest_alert(encounter_id: int):
    """Get the most recent alert for an encounter"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Alert)
            .where(Alert.encounter_id == encounter_id)
            .order_by(Alert.timestamp.desc())
        )
        return result.scalars().first()
