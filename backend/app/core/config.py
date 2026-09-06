import os
from pathlib import Path
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

# Load backend/.env if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "DentalFlow"
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    CLINIC_NAME: str = os.getenv("CLINIC_NAME", "Zendenta Dental Clinic")
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
    DEFAULT_SLOT_DURATION_MINUTES: int = 30
    
    # Storage Backend
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "supabase")
    
    # Supabase / PostgreSQL Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:VIGILai_789$$@db.puhbtqisawianlqyivyj.supabase.co:5432/postgres"
    )
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://puhbtqisawianlqyivyj.supabase.co")
    SUPABASE_DB_HOST: str = os.getenv("SUPABASE_DB_HOST", "db.puhbtqisawianlqyivyj.supabase.co")
    SUPABASE_DB_PORT: int = int(os.getenv("SUPABASE_DB_PORT", "5432"))
    SUPABASE_DB_USER: str = os.getenv("SUPABASE_DB_USER", "postgres")
    SUPABASE_DB_PASSWORD: str = os.getenv("SUPABASE_DB_PASSWORD", "VIGILai_789$$")
    SUPABASE_DB_NAME: str = os.getenv("SUPABASE_DB_NAME", "postgres")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("SIMULATOR_URL", "http://localhost:5173"),
        "*"
    ]
    
    # Storage Paths (Excel Fallback)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    WORKBOOK_PATH: Path = DATA_DIR / "clinic_data.xlsx"
    BACKUP_DIR: Path = DATA_DIR / "backups"
    LOCK_FILE_PATH: Path = DATA_DIR / "clinic_data.xlsx.lock"
    
    # Concurrency & Lock settings
    LOCK_TIMEOUT_SECONDS: float = 10.0
    AUTO_BACKUP_ON_SAVE: bool = False

settings = Settings()

# Ensure directories exist for fallback
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
