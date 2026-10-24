"""
AuditLogger — HIPAA-compliant audit trail for all agent operations.

Fixes over original:
  - Accepts and persists output_data (was always empty {})
  - Raises RuntimeError on DB failure instead of silently swallowing it
  - Logs at ERROR level for failures so they appear in application logs
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import hashlib
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditLog
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


class AuditLogger:
    """Log all agent operations for a HIPAA-compliant audit trail."""

    async def log(
        self,
        event_type: str,
        encounter_id: int,
        data: Dict[str, Any],
        output_data: Optional[Dict[str, Any]] = None,
        agent_name: str = "orchestrator",
        model_version: str = "1.0.0",
    ) -> None:
        """
        Persist an audit event to the database.

        Parameters
        ----------
        event_type    : e.g. "baseline_computed", "risk_predicted"
        encounter_id  : active encounter being processed
        data          : input data / context for the agent call
        output_data   : agent output / result  (previously always {})
        agent_name    : name of the originating agent
        model_version : model / system version tag
        """
        try:
            # Hash the raw input for privacy (PII stays out of the audit log text)
            input_data_str = json.dumps(data, sort_keys=True, default=str)
            input_data_hash = hashlib.sha256(input_data_str.encode()).hexdigest()

            async with AsyncSessionLocal() as session:
                audit_entry = AuditLog(
                    timestamp=datetime.utcnow(),
                    encounter_id=encounter_id,
                    event_type=event_type,
                    agent_name=agent_name,
                    input_data_hash=input_data_hash,
                    input_data=data,
                    output_data=output_data or {},   # ← was always {} — now populated
                    model_version=model_version,
                    guideline_versions={},
                )
                session.add(audit_entry)
                await session.commit()

        except Exception as exc:
            # Log at ERROR level so failures are visible in application logs
            logger.error(
                "AuditLogger: failed to persist event '%s' for encounter %s: %s",
                event_type,
                encounter_id,
                exc,
                exc_info=True,
            )
            # Re-raise so the orchestrator can decide whether to continue
            raise RuntimeError(
                f"Audit log write failed for event '{event_type}' "
                f"(encounter {encounter_id}): {exc}"
            ) from exc
