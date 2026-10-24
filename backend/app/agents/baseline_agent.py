from typing import List, Dict
import statistics


class BaselineAgent:
    """
    Compute patient-specific baseline vitals using Exponentially Weighted
    Moving Average (EWMA, alpha=0.2).  Older readings decay; recent readings
    contribute more.  Falls back to population defaults with < 3 readings.
    """

    ALPHA = 0.2  # EWMA smoothing factor (higher = more weight on recent values)

    DEFAULTS = {
        "heart_rate": 75,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "mean_arterial_pressure": 85,
        "respiratory_rate": 16,
        "spo2": 97,
        "temperature": 37.0,
    }

    VITAL_FIELDS = list(DEFAULTS.keys())

    async def compute_baseline(self, vitals: List[dict]) -> Dict:
        """
        Compute EWMA baseline from historical vitals.

        Uses the first 24 readings (chronological order).
        Falls back to population defaults with < 3 readings.
        """
        if not vitals or len(vitals) < 3:
            baseline = dict(self.DEFAULTS)
            baseline["sample_size"] = 0
            baseline["method"] = "population_default"
            return baseline

        window = vitals[:24] if len(vitals) >= 24 else vitals

        baseline: Dict[str, float] = {}
        for field in self.VITAL_FIELDS:
            baseline[field] = self._ewma(window, field)

        baseline["sample_size"] = len(window)
        baseline["method"] = "ewma"
        return baseline

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ewma(self, vitals: List[dict], field: str) -> float:
        """
        Compute EWMA over the time-ordered vitals list.
        Skips readings where the field is None.
        """
        valid = [v.get(field) for v in vitals if v.get(field) is not None]
        if not valid:
            return float(self.DEFAULTS.get(field, 0))

        # Seed with median of first few readings to avoid bad init
        seed = statistics.median(valid[:min(5, len(valid))])
        ewma = float(seed)
        for val in valid:
            ewma = self.ALPHA * float(val) + (1 - self.ALPHA) * ewma
        return round(ewma, 2)
