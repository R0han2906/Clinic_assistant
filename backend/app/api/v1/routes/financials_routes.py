from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/financials", tags=["Financials"])

class BankAccountSummary(BaseModel):
    account_id: str
    bank_name: str
    account_number: str
    account_holder: str
    balance: float
    account_type: str

class FinancialSummaryResponse(BaseModel):
    period: str
    total_sales: float
    total_expenses: float
    net_profit: float
    margin_percentage: float
    outstanding_invoices_count: int
    unpaid_amount: float
    bank_accounts: List[BankAccountSummary]
    recent_transactions: List[Dict[str, Any]]

@router.get("/summary", response_model=FinancialSummaryResponse)
def get_financial_summary():
    """
    Returns consolidated financial health metrics, invoice status, and bank account balances.
    """
    return FinancialSummaryResponse(
        period="Current Month (Sep 2026)",
        total_sales=48250.00,
        total_expenses=18400.00,
        net_profit=29850.00,
        margin_percentage=61.87,
        outstanding_invoices_count=4,
        unpaid_amount=3200.00,
        bank_accounts=[
            BankAccountSummary(
                account_id="ACC-001",
                bank_name="Chase Operating Account",
                account_number="•••• 4892",
                account_holder="Avicena Dental Practice LLC",
                balance=142500.00,
                account_type="Checking",
            ),
            BankAccountSummary(
                account_id="ACC-002",
                bank_name="Wells Fargo Reserve",
                account_number="•••• 9011",
                account_holder="Avicena Dental Practice LLC",
                balance=85000.00,
                account_type="Savings",
            ),
        ],
        recent_transactions=[
            {
                "id": "TX-9041",
                "date": "2026-09-06",
                "description": "Patient Payment #INV-2026-089 (Tooth Filling)",
                "type": "income",
                "amount": 450.00,
                "status": "cleared",
            },
            {
                "id": "TX-9040",
                "date": "2026-09-05",
                "description": "Dental Supply Co (Composite Resin Batch)",
                "type": "expense",
                "amount": 1200.00,
                "status": "cleared",
            },
            {
                "id": "TX-9039",
                "date": "2026-09-04",
                "description": "Utility Bill - Electricity & Water",
                "type": "expense",
                "amount": 680.00,
                "status": "cleared",
            },
        ],
    )
