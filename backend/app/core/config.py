import os
from pathlib import Path
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "DentalFlow"
    API_V1_PREFIX: str = "/api"
    CLINIC_NAME: str = "SmileCare Dental Clinic"
    TIMEZONE: str = "Asia/Kolkata"
    DEFAULT_SLOT_DURATION_MINUTES: int = 30
    CORS_ORIGINS: List[str] = ["*"]
    
    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    WORKBOOK_PATH: Path = DATA_DIR / "clinic_data.xlsx"
    BACKUP_DIR: Path = DATA_DIR / "backups"
    LOCK_FILE_PATH: Path = DATA_DIR / "clinic_data.xlsx.lock"
    
    # Concurrency & Lock settings
    LOCK_TIMEOUT_SECONDS: float = 10.0

    # Backup settings (False prevents generating a new .xlsx file on each save)
    AUTO_BACKUP_ON_SAVE: bool = False

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
