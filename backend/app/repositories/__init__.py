from app.repositories.base import BaseClinicRepository
from app.repositories.excel_repository import ExcelClinicRepository

# Singleton repository instance for dependency injection
_repository_instance: BaseClinicRepository = None

def get_repository() -> BaseClinicRepository:
    global _repository_instance
    if _repository_instance is None:
        _repository_instance = ExcelClinicRepository()
    return _repository_instance
