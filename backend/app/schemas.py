from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

# Patients
class PatientCreate(BaseModel):
    mrn: str
    name: str
    age: int
    gender: str
    admission_date: datetime

class PatientResponse(BaseModel):
    id: int
    mrn: str
    name: str
    age: int
    gender: str
    admission_date: datetime
    status: str

class PatientMonitorResponse(BaseModel):
    id: int
    mrn: str
    name: str
    age: int
    gender: str
    ward: Optional[str]
    bed: Optional[str]
    risk_level: str
    risk_types: List[str]
    last_vitals_update: Optional[datetime]
    status: str
    q_sofa_score: int
    news2_score: int

# Encounters
class EncounterCreate(BaseModel):
    patient_id: int
    admission_datetime: datetime
    chief_complaint: str
    ward: Optional[str] = None
    bed: Optional[str] = None

class EncounterResponse(BaseModel):
    id: int
    patient_id: int
    admission_datetime: datetime
    ward: Optional[str]
    bed: Optional[str]
    status: str

# Vital Signs
class VitalSignCreate(BaseModel):
    encounter_id: int
    timestamp: datetime
    heart_rate: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    mean_arterial_pressure: Optional[float] = None
    respiratory_rate: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None

class VitalSignResponse(BaseModel):
    id: int
    encounter_id: int
    timestamp: datetime
    heart_rate: Optional[float]
    systolic_bp: Optional[float]
    diastolic_bp: Optional[float]
    mean_arterial_pressure: Optional[float]
    respiratory_rate: Optional[float]
    spo2: Optional[float]
    temperature: Optional[float]

# Alerts
class AlertResponse(BaseModel):
    id: int
    encounter_id: int
    timestamp: datetime
    risk_type: str
    risk_level: str
    risk_score: float
    evidence: Dict[str, Any]
    guideline_citations: List[Dict[str, Any]]
    shap_explanations: Dict[str, Any]
    uncertainty_flags: List[str]
    status: str

class AlertUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None

# Reports
class ReportRequest(BaseModel):
    alert_id: int

class ReportResponse(BaseModel):
    report_path: str
    report_id: str

# Admin Schemas
class AdminStats(BaseModel):
    total_users: int
    user_distribution: List[Dict[str, Any]]
    active_alerts: int
    system_health: float
    audit_events: int

class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    status: str = "active"
    created_at: datetime

class AdminGuidelineResponse(BaseModel):
    id: int
    title: str
    source: str
    version: str
    publication_date: datetime
    status: str

class AdminAuditResponse(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    agent_name: str
    details: Optional[str] = None
