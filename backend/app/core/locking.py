from contextlib import contextmanager
from pathlib import Path
from typing import Optional
from filelock import FileLock, Timeout
from app.core.config import settings
from app.core.exceptions import WorkbookLockedError

@contextmanager
def get_workbook_lock(lock_file_path: Optional[Path] = None, timeout: float = settings.LOCK_TIMEOUT_SECONDS):
    """
    Acquires an exclusive OS-level file lock before reading or writing to the clinic workbook.
    Ensures safe, serialized operations during concurrent staff interactions.
    """
    target_lock = lock_file_path or settings.LOCK_FILE_PATH
    target_lock.parent.mkdir(parents=True, exist_ok=True)
    lock = FileLock(str(target_lock), timeout=timeout)
    try:
        with lock:
            yield
    except Timeout:
        raise WorkbookLockedError(
            f"Timed out after {timeout}s waiting for clinic workbook lock on {target_lock}. Another operation may be writing."
        )
