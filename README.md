<div align="center">

# 🧠 Clinical Cortex

**AI-Powered Clinical Risk Monitoring & Decision Support Platform**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-FF6F00?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

*Hospital-grade clinician decision support with multi-agent orchestration, explainable ML risk prediction, and guideline-grounded RAG retrieval.*

---

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Docs](#-api-reference) · [Contributing](#contributing)

</div>

---

## ⚡ Features

| Category | Capability |
|----------|-----------|
| **Multi-Agent Orchestration** | LangGraph-based workflow with Baseline, Trend, Risk, Explanation, and Safety agents |
| **Risk Prediction** | Hybrid clinical scoring (NEWS2) + ML (Random Forest) for Sepsis, AKI, and Respiratory Failure |
| **Explainable AI** | SHAP feature-importance explanations with uncertainty quantification |
| **RAG System** | ChromaDB-powered retrieval over NICE, WHO, and hospital-specific guidelines |
| **Safety Guardrails** | Data completeness checks, staleness detection, contradiction validation |
| **Real-Time Alerts** | WebSocket push notifications with email/SMS (Twilio) support |
| **Audit Trail** | Full HIPAA-compliant audit logging with data provenance |
| **PDF Reports** | Auto-generated clinical decision-support reports |
| **Role-Based Access** | JWT + RBAC for doctor, nurse, and admin roles |

---

## 🏗 Architecture

```
┌──────────────────┐      ┌────────────────────────────────────┐      ┌──────────────────┐
│   Patient Side   │─────▶│        Backend (FastAPI)            │─────▶│   Doctor Side    │
│                  │      │                                    │      │                  │
│ • Vitals Stream  │      │  ┌──────────────────────────────┐  │      │ • Dashboard      │
│ • Lab PDFs       │      │  │   LangGraph Orchestrator     │  │      │ • Alert Console  │
│ • EHR Notes      │      │  │                              │  │      │ • Reports        │
│                  │      │  │  Baseline ─▶ Trend ─▶ Risk   │  │      │ • Feedback       │
│                  │      │  │  Risk ─▶ SHAP ─▶ RAG         │  │      │                  │
│                  │      │  │  RAG ─▶ Explanation ─▶ Safety │  │      │                  │
│                  │      │  └──────────────────────────────┘  │      │                  │
│                  │      │                                    │      │                  │
│                  │      │  Databases:                        │      │                  │
│                  │      │  • PostgreSQL (Supabase)           │      │                  │
│                  │      │  • ChromaDB (vector store)         │      │                  │
└──────────────────┘      └────────────────────────────────────┘      └──────────────────┘
```

### Agent Pipeline

```mermaid
graph LR
    A[Vitals Ingested] --> B[Baseline Agent]
    B --> C[Trend Agent]
    C --> D[Risk Predictor]
    D --> E[SHAP Explainer]
    E --> F[RAG Retriever]
    F --> G[Explanation Agent]
    G --> H[Safety Layer]
    H --> I{Risk Level?}
    I -->|High/Critical| J[Alert + Notify]
    I -->|Low/Medium| K[Log & Continue]
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ *(or Supabase free tier)* |
| Git | 2.30+ |

### 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/clinical_cortex.git
cd clinical_cortex
```

### 2 — Backend Setup

```bash
# Create & activate virtual environment
python -m venv backend/venv
# Windows
backend\venv\Scripts\activate
# macOS / Linux
source backend/venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, secrets, etc.
```

### 3 — Database Setup

```bash
# Run schema migrations
python ../scripts/setup_database.py

# (Optional) Seed sample patient data
python ../scripts/seed_patients.py
```

> See [SETUP_SUPABASE.md](SETUP_SUPABASE.md) for detailed Supabase setup instructions.

### 4 — Train ML Models

```bash
# Generate synthetic models (creates backend/models/*.pkl)
python ../scripts/train_models.py
```

### 5 — Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

Backend available at `http://localhost:8000` — Swagger docs at `http://localhost:8000/docs`

### 6 — Frontend Setup

```bash
# From project root
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

### 7 — Test with Vitals Simulator

```bash
# In a new terminal, from project root
cd backend
python ../scripts/vitals_simulator.py
# Select option 2 for deteriorating patient simulation
```

---

## 📁 Project Structure

```
clinical_cortex/
├── backend/
│   ├── app/
│   │   ├── agents/           # LangGraph agent modules
│   │   │   ├── orchestrator.py       # Multi-agent workflow
│   │   │   ├── baseline_agent.py     # Baseline vitals computation
│   │   │   ├── trend_agent.py        # Trend detection & analysis
│   │   │   ├── risk_predictor.py     # ML risk prediction
│   │   │   ├── shap_explainer.py     # SHAP explanations
│   │   │   ├── rag_retriever.py      # Guideline retrieval (ChromaDB)
│   │   │   ├── explanation_agent.py  # Human-readable explanations
│   │   │   └── safety_layer.py       # Safety guardrails
│   │   ├── routers/          # FastAPI route handlers
│   │   │   ├── auth.py, patients.py, vitals.py
│   │   │   ├── alerts.py, reports.py, admin.py, demo.py
│   │   ├── services/         # Business logic services
│   │   │   ├── ingestion.py, notification.py
│   │   │   ├── pdf_parser.py, report_generator.py
│   │   │   ├── audit_logger.py, twilio_service.py
│   │   ├── tests/            # Unit & integration tests
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Pydantic settings
│   │   ├── database.py       # Async SQLAlchemy
│   │   ├── models.py         # ORM models
│   │   └── schemas.py        # Pydantic schemas
│   ├── models/               # Trained ML models (.pkl) — git-ignored
│   ├── .env.example          # Environment template
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page-level views
│   │   ├── context/          # React context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   └── data/             # Mock / seed data
│   ├── public/               # Static assets
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── 001_initial_schema.sql  # SQL schema migrations
├── scripts/
│   ├── setup_database.py     # DB initialization
│   ├── seed_patients.py      # Sample data seeder
│   ├── train_models.py       # ML model training
│   ├── vitals_simulator.py   # Real-time vitals simulator
│   └── check_supabase.py     # Connection verification
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
└── README.md                 # ← You are here
```

---

## 🔐 Security & HIPAA Compliance

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT tokens with bcrypt password hashing |
| **Authorization** | Role-based access control (doctor / nurse / admin) |
| **Transport** | TLS/SSL encryption in transit |
| **Storage** | Database encryption at rest (Supabase) |
| **Audit** | Complete audit trail — every access logged |
| **Sessions** | 30-minute token expiry with configurable timeout |
| **Secrets** | Environment-variable based — never committed |

> See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 🧪 Testing

```bash
# Run all tests
cd backend
pytest app/tests/ -v

# With coverage
pytest app/tests/ --cov=app --cov-report=html

# Individual test suites
pytest app/tests/test_risk_predictor.py     # Risk prediction
pytest app/tests/test_rag_retriever.py      # RAG retrieval
pytest app/tests/test_safety_layer.py       # Safety guardrails
```

---

## 📡 API Reference

Full interactive docs available at `http://localhost:8000/docs` when the server is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate & get JWT |
| `GET` | `/api/patients` | List patients |
| `GET` | `/api/patients/{id}` | Get patient details |
| `POST` | `/api/vitals` | Submit vital signs |
| `GET` | `/api/alerts` | Get alerts (filterable) |
| `POST` | `/api/alerts/{id}/acknowledge` | Acknowledge alert |
| `POST` | `/api/reports/generate` | Generate PDF report |
| `WS` | `/ws/alerts` | Real-time alert stream |

---

## ⚙️ Configuration

All configuration is managed via environment variables. Copy `.env.example` → `.env` and customize:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/clinical_cortex

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production

# Risk Thresholds
HIGH_RISK_THRESHOLD=0.6
CRITICAL_RISK_THRESHOLD=0.8

# Notifications (set MOCK_NOTIFICATIONS=True for local dev)
MOCK_NOTIFICATIONS=True
```

See [backend/.env.example](backend/.env.example) for the full list.

---

## 📱 Notification Setup

<details>
<summary><strong>Email (SMTP)</strong></summary>

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MOCK_NOTIFICATIONS=False
```
</details>

<details>
<summary><strong>SMS (Twilio)</strong></summary>

```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
MOCK_NOTIFICATIONS=False
```
</details>

---

## 🚨 Safety Notice

> [!CAUTION]
> **This system is advisory only.** It does NOT provide autonomous diagnosis, medication prescribing, or treatment recommendations. Clinician review is **always** required. All outputs must be validated by qualified medical professionals.

---

## 🐛 Troubleshooting

<details>
<summary><strong>Database connection issues</strong></summary>

- Verify `DATABASE_URL` in `.env`
- Use **Connection Pooling** mode for Supabase (port `5432`)
- Run `python scripts/setup_database.py` to re-create the schema
</details>

<details>
<summary><strong>ChromaDB issues</strong></summary>

```bash
# Clear and reseed
rm -rf chroma_db/ backend/chroma_db/
python scripts/seed_guidelines.py
```
</details>

<details>
<summary><strong>WebSocket connection failed</strong></summary>

- Ensure backend is running on port `8000`
- Check CORS origins in `backend/app/main.py`
- Verify firewall allows WebSocket connections
</details>

<details>
<summary><strong>ML models missing</strong></summary>

```bash
python scripts/train_models.py
```
</details>

---

## 🗺 Roadmap

- [ ] Docker Compose deployment
- [ ] Kubernetes Helm chart
- [ ] FHIR HL7 integration
- [ ] Multi-hospital federated learning
- [ ] Mobile companion app (React Native)
- [ ] Advanced NLP for clinical notes
- [ ] Prometheus + Grafana monitoring

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 👥 Authors & Support

For technical support, open a [GitHub Issue](../../issues).

---

<div align="center">

**Built with ❤️ for better clinical outcomes**

</div>
