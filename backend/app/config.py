from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database (Supabase)
    # Format: postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
    DATABASE_URL: str = "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

    # Supabase (API)
    # Example: https://<project-ref>.supabase.co
    SUPABASE_URL: Optional[str] = None
    # Use your Supabase "publishable/anon" API key
    SUPABASE_ANON_KEY: Optional[str] = None
    
    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@hospital.com"
    
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Mock mode for local testing
    MOCK_NOTIFICATIONS: bool = True
    
    # Risk thresholds
    HIGH_RISK_THRESHOLD: float = 0.6
    CRITICAL_RISK_THRESHOLD: float = 0.8
    
    # Alert cooldown (seconds)
    ALERT_COOLDOWN_SECONDS: int = 120
    
    # Safety layer thresholds
    MIN_VITALS_COVERAGE: float = 0.6
    MAX_VITALS_STALENESS_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
