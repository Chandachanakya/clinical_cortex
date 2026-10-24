"""
DataIngestionService — handles ingestion of vitals, labs, and clinical notes.

Fixes over original:
  - Range validation for all vital signs (raises ValueError on out-of-range data)
  - Duplicate detection: rejects readings within 30 seconds of last reading
    for the same encounter
"""
import logging
from typing import Dict
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import VitalSign, LabResult, ClinicalNote
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Physiological range limits for vital signs
VITAL_RANGES = {
    "heart_rate":              (20,  250),
    "systolic_bp":             (50,  300),
    "diastolic_bp":            (20,  200),
    "mean_arterial_pressure":  (20,  200),
    "respiratory_rate":        (4,   60),
    "spo2":                    (50,  100),
    "temperature":             (28.0, 45.0),
}

# Minimum gap between readings for the same encounter (seconds)
_DUPLICATE_GAP_SECONDS = 30


class DataIngestionService:
    """Handle data ingestion from various sources with validation."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def ingest_vitals(self, encounter_id: int, vitals_data: Dict) -> VitalSign:
        """Validate and ingest vital signs data."""
        self._validate_vitals(vitals_data)
        await self._check_vitals_duplicate(encounter_id)

        async with AsyncSessionLocal() as session:
            vital_sign = VitalSign(
                encounter_id=encounter_id,
                timestamp=vitals_data.get("timestamp", datetime.utcnow()),
                heart_rate=vitals_data.get("heart_rate"),
                systolic_bp=vitals_data.get("systolic_bp"),
                diastolic_bp=vitals_data.get("diastolic_bp"),
                mean_arterial_pressure=vitals_data.get("mean_arterial_pressure"),
                respiratory_rate=vitals_data.get("respiratory_rate"),
                spo2=vitals_data.get("spo2"),
                temperature=vitals_data.get("temperature"),
            )
            session.add(vital_sign)
            await session.commit()
            await session.refresh(vital_sign)
            logger.info(
                "Vitals ingested for encounter %s: HR=%s MAP=%s",
                encounter_id,
                vitals_data.get("heart_rate"),
                vitals_data.get("mean_arterial_pressure"),
            )
            return vital_sign

    async def ingest_lab_result(self, encounter_id: int, lab_data: Dict) -> LabResult:
        """Ingest lab result data."""
        async with AsyncSessionLocal() as session:
            lab_result = LabResult(
                encounter_id=encounter_id,
                timestamp=lab_data.get("timestamp", datetime.utcnow()),
                lab_type=lab_data.get("lab_type"),
                values=lab_data.get("values", {}),
                pdf_path=lab_data.get("pdf_path"),
            )
            session.add(lab_result)
            await session.commit()
            await session.refresh(lab_result)
            return lab_result

    async def ingest_clinical_note(self, encounter_id: int, note_data: Dict) -> ClinicalNote:
        """Ingest clinical note."""
        async with AsyncSessionLocal() as session:
            clinical_note = ClinicalNote(
                encounter_id=encounter_id,
                timestamp=note_data.get("timestamp", datetime.utcnow()),
                note_type=note_data.get("note_type"),
                content=note_data.get("content"),
                author_id=note_data.get("author_id"),
            )
            session.add(clinical_note)
            await session.commit()
            await session.refresh(clinical_note)
            return clinical_note

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def _validate_vitals(self, vitals_data: Dict) -> None:
        """
        Raise ValueError if any vital-sign value is outside physiological range.
        None / missing values are allowed (partial readings).
        """
        errors = []
        for field, (lo, hi) in VITAL_RANGES.items():
            val = vitals_data.get(field)
            if val is None:
                continue
            try:
                val = float(val)
            except (TypeError, ValueError):
                errors.append(f"{field}: non-numeric value '{val}'")
                continue
            if not (lo <= val <= hi):
                errors.append(
                    f"{field}={val} is outside physiological range [{lo}, {hi}]"
                )
        if errors:
            raise ValueError(
                f"Vital-sign validation failed for ingestion: {'; '.join(errors)}"
            )

    async def _check_vitals_duplicate(self, encounter_id: int) -> None:
        """
        Raise ValueError if a reading for this encounter was already ingested
        within the last _DUPLICATE_GAP_SECONDS seconds.
        """
        cutoff = datetime.utcnow() - timedelta(seconds=_DUPLICATE_GAP_SECONDS)
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(VitalSign)
                .where(VitalSign.encounter_id == encounter_id)
                .where(VitalSign.timestamp >= cutoff)
                .limit(1)
            )
            existing = result.scalars().first()
            if existing:
                raise ValueError(
                    f"Duplicate vitals rejected for encounter {encounter_id}: "
                    f"a reading was already ingested within the last "
                    f"{_DUPLICATE_GAP_SECONDS} seconds "
                    f"(last: {existing.timestamp.isoformat()})."
                )
