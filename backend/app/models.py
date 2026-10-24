from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # doctor, nurse, admin, patient
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    admission_date = Column(DateTime)
    discharge_date = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, discharged
    
    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")

class Encounter(Base):
    __tablename__ = "encounters"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    admission_datetime = Column(DateTime)
    discharge_datetime = Column(DateTime, nullable=True)
    chief_complaint = Column(Text)
    ward = Column(String, nullable=True)  # Added for dashboard tracking
    bed = Column(String, nullable=True)   # Added for dashboard tracking
    status = Column(String, default="active")
    
    patient = relationship("Patient", back_populates="encounters")
    vitals = relationship("VitalSign", back_populates="encounter")
    labs = relationship("LabResult", back_populates="encounter")
    notes = relationship("ClinicalNote", back_populates="encounter")
    alerts = relationship("Alert", back_populates="encounter")

class VitalSign(Base):
    __tablename__ = "vital_signs"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    timestamp = Column(DateTime, index=True)
    heart_rate = Column(Float, nullable=True)
    systolic_bp = Column(Float, nullable=True)
    diastolic_bp = Column(Float, nullable=True)
    mean_arterial_pressure = Column(Float, nullable=True)
    respiratory_rate = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    
    encounter = relationship("Encounter", back_populates="vitals")

class LabResult(Base):
    __tablename__ = "lab_results"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    timestamp = Column(DateTime)
    lab_type = Column(String)  # CBC, BMP, etc.
    values = Column(JSON)  # Store all lab values as JSON
    pdf_path = Column(String, nullable=True)
    
    encounter = relationship("Encounter", back_populates="labs")

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    timestamp = Column(DateTime)
    note_type = Column(String)  # Progress, Admission, Discharge
    content = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    
    encounter = relationship("Encounter", back_populates="notes")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    risk_type = Column(String)  # Sepsis, AKI, Respiratory Failure
    risk_level = Column(String)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Float)
    evidence = Column(JSON)
    guideline_citations = Column(JSON)
    shap_explanations = Column(JSON)
    uncertainty_flags = Column(JSON)
    status = Column(String, default="pending")  # pending, acknowledged, resolved
    feedback = Column(String, nullable=True)  # true_alert, false_alarm, insufficient_data
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    encounter = relationship("Encounter", back_populates="alerts")

class GuidelineDocument(Base):
    __tablename__ = "guideline_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    source = Column(String)  # NICE, WHO, Hospital
    version = Column(String)
    publication_date = Column(DateTime)
    file_path = Column(String)
    status = Column(String, default="active")
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    event_type = Column(String)  # risk_assessment, alert_generated, etc.
    agent_name = Column(String)
    input_data_hash = Column(String)
    input_data = Column(JSON)
    output_data = Column(JSON)
    model_version = Column(String)
    guideline_versions = Column(JSON)
