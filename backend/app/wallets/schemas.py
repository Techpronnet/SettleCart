from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from app.models.enums import LedgerEntryType, LedgerCategory, BalanceType, WithdrawalStatus

class WalletBalanceResponse(BaseModel):
    wallet_id: UUID
    user_id: UUID
    currency: str = "NGN"
    available_balance: Decimal
    pending_balance: Decimal
    total_earned: Decimal
    total_withdrawn: Decimal

class LedgerEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    wallet_id: UUID
    order_id: Optional[UUID] = None
    vendor_order_id: Optional[UUID] = None
    delivery_task_id: Optional[UUID] = None
    entry_type: LedgerEntryType
    category: LedgerCategory
    amount: Decimal
    balance_type: BalanceType
    description: str
    reference: str
    created_at: datetime

class LedgerListResponse(BaseModel):
    entries: List[LedgerEntryResponse]
    total: int
    page: int
    size: int

class AdminLedgerEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    wallet_id: UUID
    user_id: UUID
    user_email: str
    user_name: str
    user_role: str
    order_id: Optional[UUID] = None
    vendor_order_id: Optional[UUID] = None
    delivery_task_id: Optional[UUID] = None
    entry_type: LedgerEntryType
    category: LedgerCategory
    amount: Decimal
    balance_type: BalanceType
    description: str
    reference: str
    created_at: datetime

class AdminLedgerListResponse(BaseModel):
    entries: List[AdminLedgerEntryResponse]
    total: int
    page: int
    size: int

class CreateWithdrawalRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Amount in NGN to withdraw")
    bank_name: str = Field(..., min_length=2, max_length=100)
    account_number: str = Field(..., min_length=10, max_length=10, description="10-digit NUBAN account number")
    account_name: str = Field(..., min_length=2, max_length=255)
    bank_code: Optional[str] = None

class WithdrawalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    wallet_id: UUID
    amount: Decimal
    bank_name: str
    account_number: str
    account_name: str
    status: WithdrawalStatus
    reference: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class WithdrawalReviewRequest(BaseModel):
    action: str = Field(..., description="'approve' or 'reject'")
    reason: Optional[str] = None

class AdminWithdrawalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    wallet_id: UUID
    user_id: UUID
    user_email: str
    user_name: str
    user_role: str
    amount: Decimal
    bank_name: str
    account_number: str
    account_name: str
    bank_code: Optional[str] = None
    status: WithdrawalStatus
    reference: str
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class WithdrawalListResponse(BaseModel):
    withdrawals: List[AdminWithdrawalResponse]
    total: int
    page: int
    size: int

