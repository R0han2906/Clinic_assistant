from typing import Optional, List
from pydantic import BaseModel, Field

class ToothFinding(BaseModel):
    tooth_number: int = Field(..., ge=11, le=48, description="FDI two-digit tooth number (11 to 48)")
    tooth_name: Optional[str] = Field(None, description="e.g. Lateral Incisor, 2nd Molar")
    condition: Optional[str] = Field(None, description="Clinical finding e.g. Caries, Non vital, Missing, Tartar")
    treatment: Optional[str] = Field(None, description="Planned action e.g. Replace tooth, Tooth filling, Root canal, Extraction")
    notes: Optional[str] = Field(None, description="Clinical commentary for this tooth")
    status_category: str = Field("recent_findings", description="recent_findings, treated_before, recommended_treatment")

class MedicalCheckupBase(BaseModel):
    patient_id: str = Field(..., description="Target patient identifier e.g. PAT-000001")
    appointment_id: Optional[str] = Field(None, description="Linked reservation/appointment identifier e.g. APT-000001")
    dentist_id: Optional[str] = Field(None, description="Treating dentist e.g. DOC-000001")
    dentist_name: Optional[str] = Field(None, description="Treating dentist name")
    
    # Step 1: Medical Data
    blood_pressure: Optional[str] = Field(None, description="Systolic/diastolic blood pressure e.g. 130/80")
    medical_conditions: List[str] = Field(default_factory=list, description="Heart Disease, Covid-19, Haemophilia, Hepatitis, Gastritis, etc.")
    allergies: Optional[str] = Field(None, description="Drug or material allergies e.g. Penicillin, Latex")
    oral_hygiene_habits: Optional[str] = Field(None, description="Habits or brushing routine notes")
    
    # Step 2: Treatment Plan / Odontogram
    teeth_findings: List[ToothFinding] = Field(default_factory=list, description="Findings for examined teeth")
    
    # Step 3: Oral Check
    canker_sores: bool = Field(False, description="Presence of canker sores or soft tissue lesions")
    canker_sores_notes: Optional[str] = Field(None, description="e.g. The lower and upper lips have canker sores")
    anomalous_teeth: bool = Field(False, description="Presence of anomalous or impacted teeth")
    anomalous_teeth_notes: Optional[str] = Field(None, description="Location and description of anomalous teeth")
    other_oral_notes: Optional[str] = Field(None, description="Additional notes up to 200 chars")
    
    # Step 4: Plan Agreement & Documents
    consent_status: str = Field("approved", description="approved, not_now, pending")
    refusal_reason: Optional[str] = Field(None, description="Reason if treatment was deferred / refused")
    document_url_or_ref: Optional[str] = Field(None, description="Document or printable agreement identifier")
    status: str = Field("completed", description="in_progress, completed")

class MedicalCheckupCreate(MedicalCheckupBase):
    pass

class MedicalCheckupResponse(MedicalCheckupBase):
    checkup_id: str
    created_at: str
    updated_at: str
