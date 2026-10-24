from typing import Dict, List
from datetime import datetime, timedelta
from app.config import settings

# Alert cooldown: suppress repeated alerts for the same encounter
_ALERT_COOLDOWN_MINUTES = 30


class SafetyLayer:
    """
    Hard guardrails before alerting:
    - Check data completeness
    - Check data freshness
    - Check for contradictions
    - Validate risk scores
    - 30-minute per-encounter alert cooldown
    """

    def __init__(self):
        # Maps encounter_id -> last alert datetime (in-memory cooldown)
        self._alert_cooldown: Dict[int, datetime] = {}

    async def validate(self, vitals: List[dict], risk_scores: Dict,
                       explanation: Dict, encounter_id: int = 0) -> Dict:
        """
        Comprehensive safety validation
        Returns: {should_alert: bool, warnings: [], blocked: bool}
        """
        warnings = []
        blocked = False
        should_alert = False
        
        # 1. Data completeness check
        coverage = self._check_vitals_coverage(vitals)
        if coverage < settings.MIN_VITALS_COVERAGE:
            warnings.append(f"Insufficient data coverage: {coverage:.0%} (minimum: {settings.MIN_VITALS_COVERAGE:.0%})")
            blocked = True
        
        # 2. Data freshness check
        staleness = self._check_staleness(vitals)
        if staleness > settings.MAX_VITALS_STALENESS_MINUTES:
            warnings.append(f"Stale vitals: {staleness:.0f} minutes old (maximum: {settings.MAX_VITALS_STALENESS_MINUTES})")
            if staleness > 60:
                blocked = True
        
        # 3. Check for contradictory values
        contradictions = self._check_contradictions(vitals)
        if contradictions:
            warnings.extend(contradictions)
            blocked = True
        
        # 4. Validate risk scores
        max_risk = 0
        if risk_scores:
            risk_entries = [r for r in risk_scores.values() if isinstance(r, dict)]
            if risk_entries:
                max_risk = max(r.get("probability", 0) for r in risk_entries)

        if not blocked and max_risk >= settings.HIGH_RISK_THRESHOLD:
            should_alert = True

        # 5. Check for missing critical fields in explanation
        critical_missing = self._check_critical_fields(explanation)
        if critical_missing:
            warnings.extend(critical_missing)
            should_alert = False

        # 6. Alert cooldown — suppress repeated alerts within 30 minutes
        cooldown_suppressed = False
        if should_alert and not blocked:
            last_alert = self._alert_cooldown.get(encounter_id)
            if last_alert is not None:
                elapsed = (datetime.utcnow() - last_alert).total_seconds() / 60
                if elapsed < _ALERT_COOLDOWN_MINUTES:
                    warnings.append(
                        f"Alert suppressed: cooldown active for encounter {encounter_id} "
                        f"({elapsed:.0f} min elapsed, {_ALERT_COOLDOWN_MINUTES} min required)."
                    )
                    cooldown_suppressed = True
                    should_alert = False

        # Record the alert timestamp
        if should_alert:
            self._alert_cooldown[encounter_id] = datetime.utcnow()

        # Reset cooldown when patient recovers to LOW risk
        if max_risk < settings.HIGH_RISK_THRESHOLD and encounter_id in self._alert_cooldown:
            del self._alert_cooldown[encounter_id]

        return {
            "should_alert": should_alert and not blocked,
            "warnings": warnings,
            "blocked": blocked,
            "cooldown_suppressed": cooldown_suppressed,
            "data_coverage": coverage,
            "data_staleness_minutes": staleness,
            "max_risk_score": max_risk,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _check_vitals_coverage(self, vitals: List[dict]) -> float:
        """Check what percentage of required vitals are present"""
        if not vitals:
            return 0.0
        
        required_fields = ["heart_rate", "respiratory_rate", "spo2", 
                          "temperature", "mean_arterial_pressure"]
        
        latest = vitals[-1]
        present = sum(1 for field in required_fields if latest.get(field) is not None)
        
        return present / len(required_fields)
    
    def _check_staleness(self, vitals: List[dict]) -> float:
        """Check how old the latest vitals are (in minutes)"""
        if not vitals:
            return 999
        
        latest_time = vitals[-1].get("timestamp")
        if not latest_time:
            return 999
        
        if isinstance(latest_time, str):
            try:
                latest_time = datetime.fromisoformat(latest_time.replace('Z', '+00:00'))
            except:
                return 999
        
        if isinstance(latest_time, datetime):
            age = datetime.utcnow() - latest_time
            return age.total_seconds() / 60
        
        return 999
    
    def _check_contradictions(self, vitals: List[dict]) -> List[str]:
        """Check for physiologically impossible values"""
        contradictions = []
        
        if not vitals:
            return contradictions
        
        latest = vitals[-1]
        
        # Check ranges
        hr = latest.get("heart_rate")
        if hr and (hr < 20 or hr > 250):
            contradictions.append(f"Heart rate out of range: {hr}")
        
        rr = latest.get("respiratory_rate")
        if rr and (rr < 4 or rr > 60):
            contradictions.append(f"Respiratory rate out of range: {rr}")
        
        spo2 = latest.get("spo2")
        if spo2 and (spo2 < 50 or spo2 > 100):
            contradictions.append(f"SpO2 out of range: {spo2}")
        
        temp = latest.get("temperature")
        if temp and (temp < 30 or temp > 45):
            contradictions.append(f"Temperature out of range: {temp}")
        
        return contradictions
    
    def _check_critical_fields(self, explanation: Dict) -> List[str]:
        """Ensure explanation has all required fields"""
        missing = []
        
        required = ["risk_level", "risk_type", "evidence_summary", 
                   "guideline_citations", "uncertainty_flags"]
        
        for field in required:
            if field not in explanation:
                missing.append(f"Missing critical field: {field}")
        
        return missing
