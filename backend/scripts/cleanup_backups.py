"""
CLI Tool: Cleanup Redundant Backups
Removes all auto-generated backup files from data/backups/, leaving data/ clean.
"""
from pathlib import Path

def main():
    backups_dir = Path(__file__).resolve().parent.parent / "data" / "backups"
    if not backups_dir.exists():
        print("[*] No backups directory found.")
        return

    removed = 0
    for f in backups_dir.glob("*.xlsx"):
        try:
            f.unlink()
            print(f"[✓] Removed: {f.name}")
            removed += 1
        except Exception as e:
            print(f"[!] Error removing {f.name}: {e}")

    print(f"\n[✓] Finished cleanup. Removed {removed} redundant backup files.")
    print("[✓] Only the single central workbook data/clinic_data.xlsx remains.")

if __name__ == "__main__":
    main()
