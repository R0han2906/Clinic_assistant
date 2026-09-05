class DentalFlowError(Exception):
    """Base exception for all DentalFlow domain and storage errors."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class WorkbookLockedError(DentalFlowError):
    """Raised when the Excel workbook lock cannot be acquired within timeout."""
    def __init__(self, message: str = "Clinic workbook is currently locked by another operation. Please retry."):
        super().__init__(message, status_code=503)


class WorkbookWriteError(DentalFlowError):
    """Raised when an atomic write or schema validation fails."""
    def __init__(self, message: str = "Failed to safely write clinic workbook."):
        super().__init__(message, status_code=500)


class ResourceNotFoundError(DentalFlowError):
    """Raised when a patient, dentist, or appointment is not found."""
    def __init__(self, resource: str, identifier: str):
        super().__init__(f"{resource} with identifier '{identifier}' was not found.", status_code=404)


class SlotConflictError(DentalFlowError):
    """Raised when an appointment slot is already taken or unavailable."""
    def __init__(self, message: str = "The selected dentist is not available for this time range."):
        super().__init__(message, status_code=409)


class DuplicatePatientWarning(DentalFlowError):
    """Raised when potential duplicate patients exist and need staff confirmation."""
    def __init__(self, message: str, existing_matches: list):
        super().__init__(message, status_code=409)
        self.existing_matches = existing_matches
