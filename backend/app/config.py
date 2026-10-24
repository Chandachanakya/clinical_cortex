from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    # Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB]
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/clinical_cortex"

    # Supabase API (optional)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Notifications (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@hospital.com"

    # Notifications (Twilio)
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

settings = Settings()
