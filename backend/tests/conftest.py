import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path so all app imports resolve correctly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.repositories.excel_repository import ExcelClinicRepository
import app.repositories as repo_module


@pytest.fixture(scope="function")
def temp_repo(tmp_path):
    """
    Creates an isolated temporary Excel repository for each test function.
    Overrides the global singleton so all services use the temp workbook.
    Torn down after each test.
    """
    wb_file = tmp_path / "test_clinic_data.xlsx"
    bk_dir = tmp_path / "backups"
    repo = ExcelClinicRepository(workbook_path=wb_file, backup_dir=bk_dir)

    # Override global repository singleton for the test duration
    repo_module._repository_instance = repo
    yield repo
    repo_module._repository_instance = None


@pytest.fixture(scope="function")
def client(temp_repo):
    """Provides a FastAPI test client configured with isolated repository storage."""
    return TestClient(app)
