"""
CLI Tool: Reset Demo Data
Resets clinic_data.xlsx to pristine initial state (seeded dentists, schedules, and treatments).
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
from app.repositories.excel_repository import ExcelClinicRepository

def reset_demo_data():
    print("[!] WARNING: This will reset clinic_data.xlsx to initial clinic baseline.")
    if settings.WORKBOOK_PATH.exists():
        # Create a safety backup first
        settings.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        backup_path = settings.BACKUP_DIR / f"pre_reset_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        shutil.copy2(settings.WORKBOOK_PATH, backup_path)
        print(f"[*] Created safety backup at: {backup_path}")

        # Delete existing file so repository re-initializes cleanly
        try:
            settings.WORKBOOK_PATH.unlink()
        except Exception as e:
            print(f"[!] Could not remove existing file: {e}")

    # Re-initialize clean repository
    repo = ExcelClinicRepository()
    # Populate demo patients and appointments for frontend testing
    repo.seed_demo_data()
    print("[✓] Clinic workbook successfully reset and seeded with demo baseline.")

if __name__ == "__main__":
    reset_demo_data()
