from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.wallet import WithdrawalRequest
from app.wallets.schemas import (
    WalletBalanceResponse,
    LedgerEntryResponse,
    LedgerListResponse,
    CreateWithdrawalRequest,
    WithdrawalResponse,
    WithdrawalReviewRequest,
)
from app.wallets.service import WalletService

router = APIRouter()

@router.get("/me", response_model=WalletBalanceResponse)
async def get_my_wallet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the authenticated user's dynamic wallet balance.
    Derived dynamically from the immutable financial ledger.
    """
    return await WalletService.get_wallet_balance(db, user_id=current_user.id)

@router.get("/ledger", response_model=LedgerListResponse)
async def get_my_ledger(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns append-only ledger transaction history for the user's wallet."""
    wallet = await WalletService.get_or_create_wallet(db, current_user.id)
    entries, total = await WalletService.list_ledger_entries(db, wallet_id=wallet.id, page=page, size=size)
    return LedgerListResponse(entries=entries, total=total, page=page, size=size)

@router.post("/withdraw", response_model=WithdrawalResponse, status_code=status.HTTP_201_CREATED)
async def request_withdrawal(
    data: CreateWithdrawalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submits a withdrawal request against available funds.
    Immediately posts an escrow DEBIT entry to prevent double-spending.
    """
    return await WalletService.request_withdrawal(db, user_id=current_user.id, data=data)

@router.get("/withdrawals/my", response_model=List[WithdrawalResponse])
async def list_my_withdrawals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists past payout withdrawal requests for the authenticated user."""
    wallet = await WalletService.get_or_create_wallet(db, current_user.id)
    stmt = (
        select(WithdrawalRequest)
        .where(WithdrawalRequest.wallet_id == wallet.id)
        .order_by(WithdrawalRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.post("/settle/{vendor_order_id}", response_model=List[LedgerEntryResponse])
async def settle_vendor_order(
    vendor_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE)),
):
    """
    Executes the multi-party settlement engine for a DELIVERED vendor order (Admin, Finance, or System).
    Splits payout to Vendor and Dispatch Rider, updates statuses to SETTLED.
    """
    return await WalletService.settle_delivered_vendor_order(db, vendor_order_id=vendor_order_id)

@router.post("/withdrawals/{withdrawal_id}/review", response_model=WithdrawalResponse)
async def review_withdrawal(
    withdrawal_id: UUID,
    data: WithdrawalReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE)),
):
    """
    Administrative review for withdrawal requests.
    If approved: marks approved/completed.
    If rejected: releases escrow by posting compensating CREDIT back to user's wallet.
    """
    return await WalletService.review_withdrawal(
        db, withdrawal_id=withdrawal_id, admin_id=current_user.id, action=data.action, reason=data.reason
    )

