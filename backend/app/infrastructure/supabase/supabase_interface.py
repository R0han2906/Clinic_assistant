from abc import ABC, abstractmethod
from app.repositories.base import BaseClinicRepository

class SupabaseClinicRepositoryInterface(BaseClinicRepository, ABC):
    """
    Abstract interface for PostgreSQL / Supabase persistence (Phase 8).
    Implements identical methods to BaseClinicRepository, ensuring that
    swapping Excel for PostgreSQL requires zero modifications to services or controllers.
    """

    @abstractmethod
    def test_connection(self) -> bool:
        """Verifies database pool connectivity to Supabase."""
        pass
