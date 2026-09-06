import logging
from app.core.config import settings
from app.repositories.base import BaseClinicRepository
from app.repositories.supabase_repository import SupabaseClinicRepository
from app.repositories.excel_repository import ExcelClinicRepository

logger = logging.getLogger("clinic_repository")

# Singleton repository instance for dependency injection
_repository_instance: BaseClinicRepository = None

def get_repository() -> BaseClinicRepository:
    global _repository_instance
    if _repository_instance is None:
        if settings.STORAGE_BACKEND.lower() == "supabase":
            try:
                logger.info("Initializing SupabaseClinicRepository...")
                _repository_instance = SupabaseClinicRepository()
                # quick probe
                _repository_instance.initialize_storage()
                logger.info("SupabaseClinicRepository initialized and connected successfully.")
            except Exception as e:
                logger.error(f"Failed to connect to Supabase PostgreSQL: {e}. Falling back to ExcelClinicRepository.")
                _repository_instance = ExcelClinicRepository()
        else:
            logger.info("Initializing ExcelClinicRepository (STORAGE_BACKEND is excel)...")
            _repository_instance = ExcelClinicRepository()
            
    return _repository_instance
