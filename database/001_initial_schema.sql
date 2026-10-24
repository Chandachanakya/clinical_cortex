-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'nurse', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    mrn VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    admission_date TIMESTAMP,
    discharge_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Encounters table
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    admission_datetime TIMESTAMP NOT NULL,
    discharge_datetime TIMESTAMP,
    chief_complaint TEXT,
    status VARCHAR(50) DEFAULT 'active'
);

-- Vital signs table
CREATE TABLE vital_signs (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id),
    timestamp TIMESTAMP NOT NULL,
    heart_rate FLOAT,
    systolic_bp FLOAT,
    diastolic_bp FLOAT,
    mean_arterial_pressure FLOAT,
    respiratory_rate FLOAT,
    spo2 FLOAT,
    temperature FLOAT,
    CONSTRAINT vital_signs_encounter_timestamp_key UNIQUE (encounter_id, timestamp)
);

CREATE INDEX idx_vital_signs_encounter ON vital_signs(encounter_id);
CREATE INDEX idx_vital_signs_timestamp ON vital_signs(timestamp);

-- Lab results table
CREATE TABLE lab_results (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id),
    timestamp TIMESTAMP NOT NULL,
    lab_type VARCHAR(100),
    values JSONB,
    pdf_path VARCHAR(500)
);

-- Clinical notes table
CREATE TABLE clinical_notes (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id),
    timestamp TIMESTAMP NOT NULL,
    note_type VARCHAR(100),
    content TEXT,
    author_id INTEGER REFERENCES users(id)
);

-- Alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risk_type VARCHAR(100) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    risk_score FLOAT,
    evidence JSONB,
    guideline_citations JSONB,
    shap_explanations JSONB,
    uncertainty_flags JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    feedback VARCHAR(50),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_alerts_encounter ON alerts(encounter_id);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_status ON alerts(status);

-- Guideline documents table
CREATE TABLE guideline_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    source VARCHAR(200),
    version VARCHAR(50),
    publication_date TIMESTAMP,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    encounter_id INTEGER REFERENCES encounters(id),
    event_type VARCHAR(100),
    agent_name VARCHAR(100),
    input_data_hash VARCHAR(64),
    input_data JSONB,
    output_data JSONB,
    model_version VARCHAR(50),
    guideline_versions JSONB
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_encounter ON audit_logs(encounter_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);

-- Seed admin user (password: admin123)
INSERT INTO users (username, email, hashed_password, role) 
VALUES ('admin', 'admin@hospital.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5uyK3K8R7kGOe', 'admin');
