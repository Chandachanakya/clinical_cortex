"""
SHAP Explainer — uses the real shap.TreeExplainer library to produce
feature-importance values from the trained RandomForest models.
"""
import asyncio
from typing import List, Dict, Any
import numpy as np
import shap
_SHAP_AVAILABLE = True


class SHAPExplainer:
    """
    Uses shap.TreeExplainer to compute real SHAP values for the highest-risk
    condition. Falls back to a scaled-deviation heuristic if SHAP is unavailable.
    """

    # Must match RiskPredictor.FEATURE_NAMES order
    FEATURE_NAMES = [
        "heart_rate", "respiratory_rate", "spo2", "temperature",
        "mean_arterial_pressure", "hr_slope", "map_slope", "rr_slope",
        "lactate", "creatinine",
    ]

    def __init__(self, trained_models: Dict = None):
        """
        Parameters
        ----------
        trained_models : dict
            Keyed by risk type ("sepsis", "aki", "respiratory_failure").
            Each value is a fitted sklearn estimator.
            Pass ``risk_predictor.models`` after constructing RiskPredictor.
        """
        self._models = trained_models or {}
        self._explainers: Dict = {}
        # Deferring build_explainers to avoid startup hangs
        # if _SHAP_AVAILABLE and self._models:
        #     self._build_explainers()

    async def _get_explainer(self, model_name: str):
        """Lazy-load TreeExplainer for a specific model (offloaded to thread)."""
        if not _SHAP_AVAILABLE or model_name not in self._models:
            return None
        
        if model_name not in self._explainers:
            try:
                model = self._models[model_name]
                print(f"[SHAPExplainer] Building TreeExplainer for {model_name} (in background thread)...")
                # Offload CPU-bound SHAP initialization to a thread to avoid blocking the event loop
                explainer = await asyncio.to_thread(shap.TreeExplainer, model)
                self._explainers[model_name] = explainer
                print(f"[SHAPExplainer] ✓ Built TreeExplainer for {model_name}")
            except Exception as e:
                print(f"[SHAPExplainer] ✗ Could not build explainer for {model_name}: {e}")
                return None
        
        return self._explainers.get(model_name)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def explain(self, vitals: List[dict], risk_scores: Dict) -> Dict:
        """
        Generate real SHAP-based feature importance for the primary risk.

        Returns
        -------
        dict with keys:
            primary_risk  – risk type with highest probability
            shap_values   – {feature: shap_value} for the primary risk model
            top_drivers   – list of top-3 {name, impact, direction}
        """
        if not vitals or not risk_scores:
            return {}

        latest_vitals = vitals[-1]
        
        # Filter to only look at risk type dictionaries (skip 'timestamp' string)
        risk_entries = {k: v for k, v in risk_scores.items() if isinstance(v, dict)}
        
        if not risk_entries:
            return {}

        primary_risk = max(
            risk_entries.items(),
            key=lambda x: x[1].get("probability", 0)
        )[0]

        features = self._build_feature_vector(latest_vitals, {})

        # Await the explainer here
        explainer = await self._get_explainer(primary_risk)
        shap_values_dict = await self._compute_shap(primary_risk, features, latest_vitals, explainer)

        top_drivers = sorted(
            shap_values_dict.items(),
            key=lambda x: abs(x[1]),
            reverse=True,
        )[:3]

        return {
            "primary_risk": primary_risk,
            "shap_values": shap_values_dict,
            "top_drivers": [
                {
                    "name": name,
                    "impact": float(value),
                    "direction": "increasing" if value > 0 else "decreasing",
                }
                for name, value in top_drivers
            ],
        }

    def get_query_terms(self, shap_features: Dict) -> List[str]:
        """Extract query terms from SHAP features for RAG retrieval."""
        top_drivers = shap_features.get("top_drivers", [])
        terms = [d["name"] for d in top_drivers]
        terms.append(shap_features.get("primary_risk", "sepsis"))
        return terms

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_feature_vector(self, vitals: dict, labs: dict) -> np.ndarray:
        feature_vals = [
            vitals.get("heart_rate", 80),
            vitals.get("respiratory_rate", 16),
            vitals.get("spo2", 97),
            vitals.get("temperature", 37.0),
            vitals.get("mean_arterial_pressure", 85),
            0.0,   # hr_slope — not in single reading; use 0
            0.0,   # map_slope
            0.0,   # rr_slope
            labs.get("lactate", 1.0),
            labs.get("creatinine", 1.0),
        ]
        return np.array(feature_vals).reshape(1, -1)

    async def _compute_shap(
        self,
        primary_risk: str,
        features: np.ndarray,
        latest_vitals: dict,
        explainer: Any = None
    ) -> Dict[str, float]:
        """
        Return per-feature SHAP values (positive = increases risk).
        Uses real shap.TreeExplainer when available; falls back to heuristic.
        """
        if explainer is not None:
            try:
                # shap_values can also be CPU intensive, but TreeExplainer.shap_values is usually fast for trees.
                # However, to be safe, we could offload this too if needed. 
                # For now, we assume building the explainer was the main bottleneck.
                raw = explainer.shap_values(features)  # shape: (n_classes, 1, n_features)
                # For binary classifier: index [1] is the positive class
                if isinstance(raw, list):
                    shap_arr = np.array(raw[1]).flatten()
                else:
                    shap_arr = np.array(raw).flatten()
                return {
                    name: float(shap_arr[i])
                    for i, name in enumerate(self.FEATURE_NAMES)
                }
            except Exception as e:
                print(f"[SHAPExplainer] SHAP calculation error for {primary_risk}: {e}")

        # Fallback: scaled deviation from healthy population mean
        return self._heuristic_importance(latest_vitals)

    def _heuristic_importance(self, vitals: dict) -> Dict[str, float]:
        """Simple scaled-deviation fallback (used if SHAP fails)."""
        baselines = {
            "heart_rate": (80, 0.08),
            "respiratory_rate": (16, 0.12),
            "spo2": (97, -0.15),
            "temperature": (37.0, 0.10),
            "mean_arterial_pressure": (85, -0.12),
            "hr_slope": (0, 0.05),
            "map_slope": (0, 0.05),
            "rr_slope": (0, 0.04),
            "lactate": (1.2, 0.06),
            "creatinine": (1.0, 0.05),
        }
        result = {}
        for feat, (baseline, sensitivity) in baselines.items():
            val = vitals.get(feat, baseline)
            if val is None:
                val = baseline
            deviation = (val - baseline) / max(abs(baseline), 1e-6)
            result[feat] = float(deviation * sensitivity * 100)
        return result
