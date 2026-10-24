# Changelog

All notable changes to **Clinical Cortex** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-10-24

### Added

- **Multi-Agent Orchestration** — LangGraph workflow with Baseline, Trend, Risk Predictor, SHAP Explainer, RAG Retriever, Explanation, and Safety agents
- **Risk Prediction Engine** — Hybrid clinical (NEWS2) + ML (Random Forest) scoring for Sepsis, AKI, and Respiratory Failure
- **Explainable AI** — SHAP feature-importance explanations with uncertainty quantification
- **RAG System** — ChromaDB-powered guideline retrieval (NICE, WHO, hospital-specific)
- **Safety Guardrails** — Data completeness checks, staleness detection, contradiction validation
- **Real-Time Alerts** — WebSocket push notifications with email (SMTP) and SMS (Twilio) support
- **Audit Trail** — HIPAA-compliant audit logging with full data provenance
- **PDF Reports** — Auto-generated clinical decision-support reports
- **Authentication** — JWT + bcrypt with role-based access control (doctor/nurse/admin)
- **React Dashboard** — Real-time vitals monitoring, alert console, patient management, analytics
- **Admin Dashboard** — User management, system configuration, audit log viewer
- **Vitals Simulator** — Interactive testing tool with normal and deteriorating patient profiles
- **Database Schema** — PostgreSQL schema with Supabase support
- **ML Model Training** — Synthetic data generator and model training pipeline

---

[1.0.0]: https://github.com/<your-username>/clinical_cortex/releases/tag/v1.0.0
