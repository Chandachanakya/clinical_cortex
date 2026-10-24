"""
Train synthetic clinical ML models and save to backend/models/.
Generates clinically meaningful synthetic data for:
  - Sepsis risk (HR, RR, Temp, MAP)
  - AKI risk (MAP, HR, Creatinine)
  - Respiratory failure risk (SpO2, RR)
"""
import os
import sys
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Ensure script can be run from any directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(PROJECT_ROOT, "backend", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def generate_synthetic_data(n_samples: int = 5000, random_state: int = 42):
    """
    Generate synthetic patient vital-sign feature vectors with labels.

    Features (10 columns):
    [0] heart_rate
    [1] respiratory_rate
    [2] spo2
    [3] temperature
    [4] mean_arterial_pressure
    [5] hr_slope      (trend)
    [6] map_slope     (trend)
    [7] rr_slope      (trend)
    [8] lactate
    [9] creatinine
    """
    rng = np.random.default_rng(random_state)

    # Base "healthy" vitals ranges
    hr = rng.normal(80, 15, n_samples).clip(40, 200)
    rr = rng.normal(16, 4, n_samples).clip(8, 50)
    spo2 = rng.normal(97, 3, n_samples).clip(70, 100)
    temp = rng.normal(37.0, 0.7, n_samples).clip(34, 41)
    map_val = rng.normal(85, 15, n_samples).clip(40, 160)
    hr_slope = rng.normal(0, 2, n_samples)
    map_slope = rng.normal(0, 2, n_samples)
    rr_slope = rng.normal(0, 1, n_samples)
    lactate = rng.normal(1.2, 0.6, n_samples).clip(0.5, 10)
    creatinine = rng.normal(1.0, 0.4, n_samples).clip(0.3, 10)

    X = np.column_stack([hr, rr, spo2, temp, map_val,
                         hr_slope, map_slope, rr_slope,
                         lactate, creatinine])

    # ── Sepsis label ──────────────────────────────────────────────────────────
    # Positive pattern: high HR + low MAP + high RR + elevated temp/lactate
    sepsis_score = (
        (hr > 110).astype(float) * 0.35
        + (map_val < 70).astype(float) * 0.30
        + (rr > 22).astype(float) * 0.20
        + (temp > 38.3).astype(float) * 0.10
        + (lactate > 2.0).astype(float) * 0.05
    )
    sepsis_labels = (sepsis_score + rng.normal(0, 0.05, n_samples) > 0.40).astype(int)

    # ── AKI label ─────────────────────────────────────────────────────────────
    # Positive pattern: low MAP + high creatinine
    aki_score = (
        (map_val < 65).astype(float) * 0.50
        + (creatinine > 1.5).astype(float) * 0.35
        + (hr > 110).astype(float) * 0.15
    )
    aki_labels = (aki_score + rng.normal(0, 0.05, n_samples) > 0.40).astype(int)

    # ── Respiratory failure label ─────────────────────────────────────────────
    # Positive pattern: low SpO2 + high RR
    resp_score = (
        (spo2 < 92).astype(float) * 0.60
        + (rr > 26).astype(float) * 0.40
    )
    resp_labels = (resp_score + rng.normal(0, 0.05, n_samples) > 0.40).astype(int)

    return X, sepsis_labels, aki_labels, resp_labels


def train_and_save(name: str, X: np.ndarray, y: np.ndarray) -> None:
    """Train a RandomForest classifier and persist it to disk."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    accuracy = clf.score(X_test, y_test)
    path = os.path.join(MODELS_DIR, f"{name}_model.pkl")
    joblib.dump(clf, path)
    print(f"  ✓ Saved {name}_model.pkl  (test accuracy: {accuracy:.3f})")


if __name__ == "__main__":
    print("Generating synthetic training data …")
    X, y_sepsis, y_aki, y_resp = generate_synthetic_data()

    print(f"  Dataset size: {X.shape[0]} samples × {X.shape[1]} features")
    print(f"  Sepsis prevalence:  {y_sepsis.mean():.1%}")
    print(f"  AKI prevalence:     {y_aki.mean():.1%}")
    print(f"  Resp. prevalence:   {y_resp.mean():.1%}\n")

    print(f"Training models → {MODELS_DIR}")
    train_and_save("sepsis", X, y_sepsis)
    train_and_save("aki", X, y_aki)
    train_and_save("respiratory", X, y_resp)

    print("\n✅ All models trained and saved successfully.")
