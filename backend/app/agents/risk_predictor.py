import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from typing import Dict, List
import joblib
import os
from datetime import datetime

# Path to saved models directory
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")


class RiskPredictor:
    """
    Hybrid risk predictor:
    - Clinical scoring (NEWS2-like, 40% weight)
    - Trained RandomForest ML model (60% weight)
    Models are loaded from backend/models/*.pkl; trained on synthetic data if not found.
    """

    # Feature names must match _extract_features() order
    FEATURE_NAMES = [
        "heart_rate", "respiratory_rate", "spo2", "temperature",
        "mean_arterial_pressure", "hr_slope", "map_slope", "rr_slope",
        "lactate", "creatinine"
    ]

    def __init__(self):
        self.sepsis_model = self._load_or_create_model("sepsis")
        self.aki_model = self._load_or_create_model("aki")
        self.respiratory_model = self._load_or_create_model("respiratory")
        # Expose trained models for SHAP explainer
        self.models = {
            "sepsis": self.sepsis_model,
            "aki": self.aki_model,
            "respiratory_failure": self.respiratory_model,
        }

    # ------------------------------------------------------------------
    # Model loading / training
    # ------------------------------------------------------------------

    def _load_or_create_model(self, risk_type: str) -> RandomForestClassifier:
        """Load a pre-trained model from disk, or train one on synthetic data."""
        path = os.path.join(_MODELS_DIR, f"{risk_type}_model.pkl")
        if os.path.exists(path):
            try:
                model = joblib.load(path)
                return model
            except Exception as f:
                print(f"[RiskPredictor] Failed to load {risk_type} model: {f}")

        print(f"[RiskPredictor] Training synthetic {risk_type} model …")
        return self._train_synthetic_model(risk_type)

    def _train_synthetic_model(self, risk_type: str) -> RandomForestClassifier:
        """Generate synthetic clinical data and train a RandomForest classifier."""
        rng = np.random.default_rng(42)
        n = 5000

        hr       = rng.normal(80, 15, n).clip(40, 200)
        rr       = rng.normal(16, 4, n).clip(8, 50)
        spo2     = rng.normal(97, 3, n).clip(70, 100)
        temp     = rng.normal(37.0, 0.7, n).clip(34, 41)
        map_val  = rng.normal(85, 15, n).clip(40, 160)
        hr_slope = rng.normal(0, 2, n)
        map_slope = rng.normal(0, 2, n)
        rr_slope = rng.normal(0, 1, n)
        lactate  = rng.normal(1.2, 0.6, n).clip(0.5, 10)
        creatinine = rng.normal(1.0, 0.4, n).clip(0.3, 10)

        X = np.column_stack([hr, rr, spo2, temp, map_val,
                             hr_slope, map_slope, rr_slope, lactate, creatinine])

        if risk_type == "sepsis":
            score = ((hr > 110).astype(float) * 0.35
                     + (map_val < 70).astype(float) * 0.30
                     + (rr > 22).astype(float) * 0.20
                     + (temp > 38.3).astype(float) * 0.10
                     + (lactate > 2.0).astype(float) * 0.05)
        elif risk_type == "aki":
            score = ((map_val < 65).astype(float) * 0.50
                     + (creatinine > 1.5).astype(float) * 0.35
                     + (hr > 110).astype(float) * 0.15)
        else:  # respiratory
            score = ((spo2 < 92).astype(float) * 0.60
                     + (rr > 26).astype(float) * 0.40)

        y = (score + rng.normal(0, 0.05, n) > 0.40).astype(int)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y)

        clf = RandomForestClassifier(
            n_estimators=200, max_depth=8,
            min_samples_leaf=5, random_state=42, n_jobs=-1)
        clf.fit(X_train, y_train)

        accuracy = clf.score(X_test, y_test)
        print(f"  → {risk_type} model accuracy: {accuracy:.3f}")

        # Persist so next startup skips training
        os.makedirs(_MODELS_DIR, exist_ok=True)
        path = os.path.join(_MODELS_DIR, f"{risk_type}_model.pkl")
        try:
            joblib.dump(clf, path)
            print(f"  → Saved {path}")
        except Exception as e:
            print(f"  → Could not save model: {e}")

        return clf
    
    async def predict_risk(self, vitals: List[dict], labs: dict, trends: dict) -> Dict:
        """
        Predict 6-12 hour risk using hybrid approach:
        - NEWS2-like clinical scoring
        - ML probability model
        """
        if not vitals or len(vitals) == 0:
            return self._default_risk_scores()
        
        # Calculate NEWS2-like score
        clinical_score = self._calculate_clinical_score(vitals[-1])
        
        # Extract features for ML model
        features = self._extract_features(vitals, labs, trends)
        
        # ML predictions
        sepsis_prob = self._predict_with_fallback(self.sepsis_model, features)
        aki_prob = self._predict_with_fallback(self.aki_model, features)
        resp_prob = self._predict_with_fallback(self.respiratory_model, features)
        
        # Combine clinical + ML scores
        sepsis_risk = self._hybrid_score(clinical_score["sepsis"], sepsis_prob)
        aki_risk = self._hybrid_score(clinical_score["aki"], aki_prob)
        resp_risk = self._hybrid_score(clinical_score["respiratory"], resp_prob)
        
        return {
            "sepsis": {
                "probability": float(sepsis_risk),
                "level": self._risk_level(sepsis_risk),
                "clinical_score": clinical_score["sepsis"],
                "ml_probability": float(sepsis_prob)
            },
            "aki": {
                "probability": float(aki_risk),
                "level": self._risk_level(aki_risk),
                "clinical_score": clinical_score["aki"],
                "ml_probability": float(aki_prob)
            },
            "respiratory_failure": {
                "probability": float(resp_risk),
                "level": self._risk_level(resp_risk),
                "clinical_score": clinical_score["respiratory"],
                "ml_probability": float(resp_prob)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _calculate_clinical_score(self, vitals: dict) -> Dict:
        """NEWS2-like scoring"""
        hr = vitals.get("heart_rate", 80)
        rr = vitals.get("respiratory_rate", 16)
        spo2 = vitals.get("spo2", 97)
        temp = vitals.get("temperature", 37)
        map_val = vitals.get("mean_arterial_pressure", 85)
        
        # Simplified sepsis score
        sepsis_score = 0
        if hr > 100: sepsis_score += 2
        if temp > 38 or temp < 36: sepsis_score += 2
        if rr > 22: sepsis_score += 1
        if map_val < 70: sepsis_score += 2
        
        # Simplified AKI score
        aki_score = 0
        if map_val < 65: aki_score += 3
        if hr > 110: aki_score += 1
        
        # Simplified respiratory score
        resp_score = 0
        if rr > 24: resp_score += 2
        if spo2 < 92: resp_score += 3
        elif spo2 < 94: resp_score += 2
        
        return {
            "sepsis": sepsis_score / 7.0,  # Normalize
            "aki": aki_score / 4.0,
            "respiratory": resp_score / 5.0
        }
    
    def _extract_features(self, vitals: List[dict], labs: dict, trends: dict) -> np.ndarray:
        """Extract ML features"""
        if not vitals:
            return np.zeros(10)
        
        latest = vitals[-1]
        features = [
            latest.get("heart_rate", 80),
            latest.get("respiratory_rate", 16),
            latest.get("spo2", 97),
            latest.get("temperature", 37),
            latest.get("mean_arterial_pressure", 85),
            trends.get("hr_slope", 0),
            trends.get("map_slope", 0),
            trends.get("rr_slope", 0),
            labs.get("lactate", 1.0),
            labs.get("creatinine", 1.0)
        ]
        return np.array(features).reshape(1, -1)
    
    def _predict_with_fallback(self, model: RandomForestClassifier, features: np.ndarray) -> float:
        """Return the positive-class probability from the trained model."""
        try:
            proba = model.predict_proba(features)
            return float(proba[0][1])
        except Exception as e:
            print(f"[RiskPredictor] predict_proba failed: {e}")
            return 0.1
    
    def _hybrid_score(self, clinical: float, ml_prob: float) -> float:
        """Combine clinical and ML scores"""
        # Weight: 60% ML, 40% clinical
        return 0.6 * ml_prob + 0.4 * clinical
    
    def _risk_level(self, score: float) -> str:
        """Convert score to risk level"""
        if score >= 0.8:
            return "CRITICAL"
        elif score >= 0.6:
            return "HIGH"
        elif score >= 0.3:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _default_risk_scores(self) -> Dict:
        return {
            "sepsis": {"probability": 0.0, "level": "LOW"},
            "aki": {"probability": 0.0, "level": "LOW"},
            "respiratory_failure": {"probability": 0.0, "level": "LOW"}
        }
