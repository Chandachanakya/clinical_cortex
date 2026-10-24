"""
TrendAgent — detects trends in patient vital signs.

Enhancements over original:
  - Z-score–based anomaly detection (flags |z| > 2.5)
  - qSOFA composite scoring
  - NEWS2 aggregate scoring
  - Multi-vital correlation (rising HR + falling MAP = qSOFA pattern)
"""
from typing import List, Dict
import numpy as np
from datetime import datetime


# ── NEWS2 normal ranges ────────────────────────────────────────────────────────
_NEWS2_PARAMS = {
    "respiratory_rate": {
        "ranges": [(0, 8, 3), (9, 11, 1), (12, 20, 0), (21, 24, 2), (25, 999, 3)]
    },
    "spo2": {
        "ranges": [(0, 91, 3), (92, 93, 2), (94, 95, 1), (96, 100, 0)]
    },
    "systolic_bp": {
        "ranges": [(0, 90, 3), (91, 100, 2), (101, 110, 1), (111, 219, 0), (220, 999, 3)]
    },
    "heart_rate": {
        "ranges": [(0, 40, 3), (41, 50, 1), (51, 90, 0), (91, 110, 1), (111, 130, 2), (131, 999, 3)]
    },
    "temperature": {
        "ranges": [(0, 35.0, 3), (35.1, 36.0, 1), (36.1, 38.0, 0), (38.1, 39.0, 1), (39.1, 99, 2)]
    },
}


class TrendAgent:
    """Detect trends, anomalies, and composite scores in vital signs."""

    async def detect_trends(self, vitals: List[dict], baseline: Dict) -> Dict:
        """
        Returns slopes, deviations, anomalies, qSOFA, and NEWS2 scores.
        """
        if not vitals or len(vitals) < 2:
            return self._default_trends()

        timestamps, hr_values, map_values, rr_values, spo2_values, temp_values = \
            self._extract_series(vitals)

        trends = {
            # Slopes (linear regression)
            "hr_slope": self._calculate_slope(timestamps, hr_values),
            "map_slope": self._calculate_slope(timestamps, map_values),
            "rr_slope": self._calculate_slope(timestamps, rr_values),
            "spo2_slope": self._calculate_slope(timestamps, spo2_values),
            "temp_slope": self._calculate_slope(timestamps, temp_values),
            # Deviations from baseline
            "hr_deviation": self._calculate_deviation(hr_values, baseline.get("heart_rate", 75)),
            "map_deviation": self._calculate_deviation(map_values, baseline.get("mean_arterial_pressure", 85)),
            "rr_deviation": self._calculate_deviation(rr_values, baseline.get("respiratory_rate", 16)),
            "spo2_deviation": self._calculate_deviation(spo2_values, baseline.get("spo2", 97)),
            "temp_deviation": self._calculate_deviation(temp_values, baseline.get("temperature", 37.0)),
            # Anomaly detection (Z-score)
            "anomalies": self._detect_anomalies(vitals),
            # Composite clinical scores
            "qsofa_score": self._calculate_qsofa(vitals[-1]),
            "news2_score": self._calculate_news2(vitals[-1]),
            "multi_vital_correlation": self._multi_vital_correlation(
                hr_values, map_values, rr_values, spo2_values),
        }
        return trends

    # ------------------------------------------------------------------
    # Data extraction
    # ------------------------------------------------------------------

    def _extract_series(self, vitals):
        timestamps, hr, mp, rr, sp, tp = [], [], [], [], [], []
        for v in vitals:
            ts = v.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            timestamps.append(ts)
            hr.append(v.get("heart_rate"))
            mp.append(v.get("mean_arterial_pressure"))
            rr.append(v.get("respiratory_rate"))
            sp.append(v.get("spo2"))
            tp.append(v.get("temperature"))
        return timestamps, hr, mp, rr, sp, tp

    # ------------------------------------------------------------------
    # Slope & deviation
    # ------------------------------------------------------------------

    def _calculate_slope(self, timestamps, values) -> float:
        valid = [(ts, v) for ts, v in zip(timestamps, values) if v is not None]
        if len(valid) < 2:
            return 0.0
        first_ts = valid[0][0]
        x = [(ts - first_ts).total_seconds() / 3600 for ts, _ in valid]
        y = [v for _, v in valid]
        n = len(x)
        sum_x = sum(x);  sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(xi ** 2 for xi in x)
        denom = n * sum_x2 - sum_x ** 2
        if abs(denom) < 1e-10:
            return 0.0
        return float((n * sum_xy - sum_x * sum_y) / denom)

    def _calculate_deviation(self, values, baseline) -> float:
        valid = [v for v in values if v is not None]
        if not valid:
            return 0.0
        return float(sum(abs(v - baseline) for v in valid) / len(valid))

    # ------------------------------------------------------------------
    # Anomaly detection — Z-score per vital
    # ------------------------------------------------------------------

    def _detect_anomalies(self, vitals: List[dict]) -> List[Dict]:
        """Flag readings where |Z-score| > 2.5 across the series."""
        anomalies = []
        fields = ["heart_rate", "respiratory_rate", "spo2",
                  "temperature", "mean_arterial_pressure"]
        for field in fields:
            values = [v.get(field) for v in vitals if v.get(field) is not None]
            if len(values) < 3:
                continue
            arr = np.array(values, dtype=float)
            mean, std = arr.mean(), arr.std()
            if std < 1e-6:
                continue
            z_scores = (arr - mean) / std
            for i, z in enumerate(z_scores):
                if abs(z) > 2.5:
                    anomalies.append({
                        "field": field,
                        "value": float(arr[i]),
                        "z_score": round(float(z), 2),
                        "mean": round(float(mean), 2),
                        "std": round(float(std), 2),
                        "severity": "critical" if abs(z) > 3.5 else "warning",
                    })
        return anomalies

    # ------------------------------------------------------------------
    # Composite clinical scores
    # ------------------------------------------------------------------

    def _calculate_qsofa(self, vitals: dict) -> Dict:
        """
        Quick SOFA (qSOFA): 0-3 score.
        ≥2 = high risk of poor outcome in suspected infection.
        """
        score = 0
        components = {}

        rr = vitals.get("respiratory_rate")
        if rr is not None:
            components["respiratory_rate"] = rr
            if rr >= 22:
                score += 1

        sbp = vitals.get("systolic_bp")
        map_val = vitals.get("mean_arterial_pressure")
        # Use SBP; approximate from MAP if SBP missing
        effective_sbp = sbp if sbp is not None else (
            int(map_val * 1.33) if map_val is not None else None)
        if effective_sbp is not None:
            components["systolic_bp_approx"] = effective_sbp
            if effective_sbp <= 100:
                score += 1

        # Altered consciousness = 1 point (not captured in vitals alone)
        # Flag if Glasgow approximation: assumed normal unless explicitly set
        components["altered_consciousness"] = False

        return {"score": score, "max": 3, "components": components,
                "high_risk": score >= 2}

    def _calculate_news2(self, vitals: dict) -> Dict:
        """NEWS2 aggregate score (0–20). ≥7 = emergency response required."""
        total = 0
        breakdown = {}

        for param, config in _NEWS2_PARAMS.items():
            val = vitals.get(param)
            if val is None:
                continue
            for lo, hi, pts in config["ranges"]:
                if lo <= val <= hi:
                    total += pts
                    breakdown[param] = pts
                    break

        risk_level = (
            "LOW" if total <= 4
            else "MEDIUM" if total <= 6
            else "HIGH"
        )
        return {"score": total, "max": 20, "risk_level": risk_level, "breakdown": breakdown}

    def _multi_vital_correlation(self, hr, map_val, rr, spo2) -> Dict:
        """Detect clinically meaningful multi-vital patterns."""
        patterns = []
        hr_vals = [v for v in hr if v is not None]
        map_vals = [v for v in map_val if v is not None]
        rr_vals = [v for v in rr if v is not None]
        spo2_vals = [v for v in spo2 if v is not None]

        if hr_vals and map_vals:
            if hr_vals[-1] > 100 and map_vals[-1] < 70:
                patterns.append("high_hr_low_map")
        if rr_vals and spo2_vals:
            if rr_vals[-1] > 22 and spo2_vals[-1] < 94:
                patterns.append("high_rr_low_spo2")
        if hr_vals and rr_vals and (len(hr_vals) >= 2 and len(rr_vals) >= 2):
            hr_rising = hr_vals[-1] > hr_vals[0]
            map_falling = len(map_vals) >= 2 and map_vals[-1] < map_vals[0]
            if hr_rising and map_falling:
                patterns.append("compensatory_tachycardia")
        return {"patterns": patterns, "count": len(patterns)}

    # ------------------------------------------------------------------
    # Default
    # ------------------------------------------------------------------

    def _default_trends(self) -> Dict:
        return {
            "hr_slope": 0.0, "map_slope": 0.0, "rr_slope": 0.0,
            "spo2_slope": 0.0, "temp_slope": 0.0,
            "hr_deviation": 0.0, "map_deviation": 0.0, "rr_deviation": 0.0,
            "spo2_deviation": 0.0, "temp_deviation": 0.0,
            "anomalies": [],
            "qsofa_score": {"score": 0, "max": 3, "high_risk": False},
            "news2_score": {"score": 0, "max": 20, "risk_level": "LOW"},
            "multi_vital_correlation": {"patterns": [], "count": 0},
        }
