from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, status
from app.models.patient_request import (
    PatientRequestCreate, PatientRequestResponse, PatientRequestReview
)
from app.services import get_patient_request_service, PatientRequestService

patient_request_router = APIRouter(prefix="/patient-requests", tags=["Patient Requests (Simulator)"])

@patient_request_router.post("", response_model=PatientRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_patient_request(
    request_data: PatientRequestCreate,
    service: PatientRequestService = Depends(get_patient_request_service)
):
    """
    Submit a patient appointment request (used by Patient Request Simulator and future WhatsApp webhooks).
    Validates slot availability before queuing request.
    """
    return service.submit_request(request_data)


@patient_request_router.get("", response_model=List[PatientRequestResponse])
def list_patient_requests(
    status: Optional[str] = None,
    service: PatientRequestService = Depends(get_patient_request_service)
):
    """List all patient requests with optional status filter (e.g. pending, approved, rejected)."""
    return service.list_requests(status=status)


@patient_request_router.get("/{request_id}", response_model=PatientRequestResponse)
def get_patient_request(
    request_id: str,
    service: PatientRequestService = Depends(get_patient_request_service)
):
    """Retrieve details of a single patient request."""
    return service.get_request(request_id)


@patient_request_router.post("/{request_id}/approve", status_code=status.HTTP_200_OK)
def approve_patient_request(
    request_id: str,
    review: Optional[PatientRequestReview] = None,
    service: PatientRequestService = Depends(get_patient_request_service)
):
    """
    Approve a pending request:
    Automatically ensures patient record exists, confirms appointment under lock,
    and marks request as approved.
    """
    notes = review.review_notes if review else None
    return service.approve_request(request_id, review_notes=notes)


@patient_request_router.post("/{request_id}/reject", response_model=PatientRequestResponse, status_code=status.HTTP_200_OK)
def reject_patient_request(
    request_id: str,
    review: Optional[PatientRequestReview] = None,
    service: PatientRequestService = Depends(get_patient_request_service)
):
    """Reject a pending patient request with optional staff notes."""
    notes = review.review_notes if review else None
    return service.reject_request(request_id, review_notes=notes)
