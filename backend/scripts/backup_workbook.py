"""
CLI Tool: Backup Clinic Workbook
Creates an immediate timestamped backup of clinic_data.xlsx in data/backups/
"""
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings

def backup_workbook() -> Path:
    if not settings.WORKBOOK_PATH.exists():
        print(f"[!] Error: Workbook not found at {settings.WORKBOOK_PATH}")
        sys.exit(1)

    settings.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = settings.BACKUP_DIR / f"clinic_data_manual_backup_{timestamp}.xlsx"

    shutil.copy2(settings.WORKBOOK_PATH, backup_path)
    print(f"[✓] Backup created successfully:\n    {backup_path}")
    return backup_path

if __name__ == "__main__":
    backup_workbook()
