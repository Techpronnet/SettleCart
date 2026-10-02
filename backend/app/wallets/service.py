import secrets
from uuid import UUID
from decimal import Decimal
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload

from app.models.wallet import Wallet, LedgerEntry, WithdrawalRequest
from app.models.user import User
from app.models.order import Order, VendorOrder
from app.models.delivery import DeliveryTask
from app.models.enums import (
    LedgerEntryType,
    LedgerCategory,
    BalanceType,
    WithdrawalStatus,
    VendorOrderStatus,
    OrderStatus,
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException
from app.wallets.schemas import WalletBalanceResponse, CreateWithdrawalRequest

class WalletService:
    @staticmethod
    async def get_or_create_wallet(db: AsyncSession, user_id: UUID) -> Wallet:
        """Retrieves an existing wallet for a user or initializes one."""
        stmt = select(Wallet).where(Wallet.user_id == user_id)
        res = await db.execute(stmt)
        wallet = res.scalar_one_or_none()

        if not wallet:
            wallet = Wallet(user_id=user_id, currency="NGN")
            db.add(wallet)
            await db.commit()
            await db.refresh(wallet)

        return wallet

    @staticmethod
    async def get_wallet_balance(db: AsyncSession, user_id: UUID) -> WalletBalanceResponse:
        """
        Derives wallet balances dynamically from the immutable ledger (SRS §10.3 / FR-FIN-005).
        Guarantees that balances cannot be arbitrarily overwritten or drift from transaction history.
        """
        wallet = await WalletService.get_or_create_wallet(db, user_id)

        # Available Balance calculation: Sum(Credits) - Sum(Debits) for AVAILABLE balance type
        avail_stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount),
                        else_=-LedgerEntry.amount,
                    )
                ),
                Decimal("0.00"),
            )
        ).where(
            LedgerEntry.wallet_id == wallet.id,
            LedgerEntry.balance_type == BalanceType.AVAILABLE,
        )
        available_balance = await db.scalar(avail_stmt) or Decimal("0.00")

        # Pending Balance calculation: Sum(Credits) - Sum(Debits) for PENDING balance type
        pending_stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (LedgerEntry.entry_type == LedgerEntryType.CREDIT, LedgerEntry.amount),
                        else_=-LedgerEntry.amount,
                    )
                ),
                Decimal("0.00"),
            )
        ).where(
            LedgerEntry.wallet_id == wallet.id,
            LedgerEntry.balance_type == BalanceType.PENDING,
        )
        pending_balance = await db.scalar(pending_stmt) or Decimal("0.00")

        # Total Earned (all credits from VENDOR_EARNINGS and DISPATCH_EARNINGS)
        earned_stmt = select(
            func.coalesce(func.sum(LedgerEntry.amount), Decimal("0.00"))
        ).where(
            LedgerEntry.wallet_id == wallet.id,
            LedgerEntry.entry_type == LedgerEntryType.CREDIT,
            LedgerEntry.category.in_([LedgerCategory.VENDOR_EARNINGS, LedgerCategory.DISPATCH_EARNINGS]),
        )
        total_earned = await db.scalar(earned_stmt) or Decimal("0.00")

        # Total Withdrawn
        withdrawn_stmt = select(
            func.coalesce(func.sum(WithdrawalRequest.amount), Decimal("0.00"))
        ).where(
            WithdrawalRequest.wallet_id == wallet.id,
            WithdrawalRequest.status.in_([WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED]),
        )
        total_withdrawn = await db.scalar(withdrawn_stmt) or Decimal("0.00")

        return WalletBalanceResponse(
            wallet_id=wallet.id,
            user_id=wallet.user_id,
            currency=wallet.currency,
            available_balance=available_balance.quantize(Decimal("0.01")),
            pending_balance=pending_balance.quantize(Decimal("0.01")),
            total_earned=total_earned.quantize(Decimal("0.01")),
            total_withdrawn=total_withdrawn.quantize(Decimal("0.01")),
        )

    @staticmethod
    async def record_ledger_entry(
        db: AsyncSession,
        wallet_id: UUID,
        entry_type: LedgerEntryType,
        category: LedgerCategory,
        amount: Decimal,
        balance_type: BalanceType,
        description: str,
        reference: str,
        order_id: Optional[UUID] = None,
        vendor_order_id: Optional[UUID] = None,
        delivery_task_id: Optional[UUID] = None,
    ) -> LedgerEntry:
        """
        Posts an append-only, immutable ledger record (FR-FIN-001).
        Enforces idempotency by unique reference constraint (FR-FIN-004).
        """
        # Idempotency check
        existing = await db.scalar(select(LedgerEntry).where(LedgerEntry.reference == reference))
        if existing:
            return existing

        entry = LedgerEntry(
            wallet_id=wallet_id,
            order_id=order_id,
            vendor_order_id=vendor_order_id,
            delivery_task_id=delivery_task_id,
            entry_type=entry_type,
            category=category,
            amount=amount.quantize(Decimal("0.01")),
            balance_type=balance_type,
            description=description,
            reference=reference,
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    @staticmethod
    async def settle_delivered_vendor_order(
        db: AsyncSession, vendor_order_id: UUID
    ) -> List[LedgerEntry]:
        """
        Settlement Engine Execution (SRS §10.2 / §10.4):
        Triggered when a vendor order is verified and DELIVERED.
        Splits payment into Vendor Net Payout, Dispatch Rider Earnings, and Platform Fee.
        Updates order and vendor order status to SETTLED.
        """
        stmt = (
            select(VendorOrder)
            .options(
                selectinload(VendorOrder.store).selectinload(VendorOrder.store.property.mapper.class_.business),
                selectinload(VendorOrder.delivery_task),
                selectinload(VendorOrder.order).selectinload(Order.vendor_orders),
            )
            .where(VendorOrder.id == vendor_order_id)
        )
        res = await db.execute(stmt)
        vo = res.scalar_one_or_none()

        if not vo:
            raise NotFoundException("Vendor order not found")

        # Check idempotency: if already settled, return existing ledger entries
        ref_prefix = f"SETTLE-VO-{vo.id}"
        existing_entries = (
            await db.execute(select(LedgerEntry).where(LedgerEntry.vendor_order_id == vo.id))
        ).scalars().all()
        if existing_entries:
            return list(existing_entries)

        entries = []
        vendor_owner_id = vo.store.business.owner_id
        vendor_wallet = await WalletService.get_or_create_wallet(db, vendor_owner_id)

        # 1. Vendor Net Payout (95% of product subtotal, 5% platform commission)
        subtotal = vo.subtotal
        platform_commission = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
        vendor_payout = subtotal - platform_commission

        vendor_ref = f"{ref_prefix}-VENDOR"
        vendor_entry = await WalletService.record_ledger_entry(
            db,
            wallet_id=vendor_wallet.id,
            entry_type=LedgerEntryType.CREDIT,
            category=LedgerCategory.VENDOR_EARNINGS,
            amount=vendor_payout,
            balance_type=BalanceType.AVAILABLE,
            description=f"Earnings for Vendor Order {vo.id} (Store: {vo.store.name})",
            reference=vendor_ref,
            order_id=vo.order_id,
            vendor_order_id=vo.id,
        )
        entries.append(vendor_entry)

        # 2. Dispatch Rider Earnings
        if vo.delivery_task and vo.delivery_task.rider_id:
            rider_id = vo.delivery_task.rider_id
            rider_wallet = await WalletService.get_or_create_wallet(db, rider_id)
            rider_earnings = vo.delivery_task.dispatch_earnings

            rider_ref = f"{ref_prefix}-DISPATCH"
            rider_entry = await WalletService.record_ledger_entry(
                db,
                wallet_id=rider_wallet.id,
                entry_type=LedgerEntryType.CREDIT,
                category=LedgerCategory.DISPATCH_EARNINGS,
                amount=rider_earnings,
                balance_type=BalanceType.AVAILABLE,
                description=f"Dispatch delivery fee for Order {vo.order.order_number}",
                reference=rider_ref,
                order_id=vo.order_id,
                vendor_order_id=vo.id,
                delivery_task_id=vo.delivery_task.id,
            )
            entries.append(rider_entry)

        # Transition Vendor Order to SETTLED
        vo.status = VendorOrderStatus.SETTLED

        # Check Parent Order: If all vendor orders are SETTLED, mark Order as SETTLED
        parent_order = vo.order
        if parent_order:
            all_settled = all(
                child_vo.status == VendorOrderStatus.SETTLED
                for child_vo in parent_order.vendor_orders
            )
            if all_settled:
                parent_order.status = OrderStatus.SETTLED

        await db.commit()

        try:
            from app.notifications.service import NotificationService
            await NotificationService.dispatch_settlement_credit(
                db, vendor_owner_id, float(vendor_payout), vendor_ref, "Vendor"
            )
            if vo.delivery_task and vo.delivery_task.rider_id:
                await NotificationService.dispatch_settlement_credit(
                    db, vo.delivery_task.rider_id, float(rider_earnings), rider_ref, "Dispatch Rider"
                )
        except Exception:
            pass

        return entries

    @staticmethod
    async def request_withdrawal(
        db: AsyncSession, user_id: UUID, data: CreateWithdrawalRequest
    ) -> WithdrawalRequest:
        """
        Submits a payout withdrawal request against available wallet balance.
        Immediately posts an escrow DEBIT to the ledger so funds cannot be double-spent.
        """
        balance = await WalletService.get_wallet_balance(db, user_id)
        if balance.available_balance < data.amount:
            raise BadRequestException(
                f"Insufficient available balance (Available: ₦{balance.available_balance:,.2f})"
            )

        wallet = await WalletService.get_or_create_wallet(db, user_id)
        ref = f"WD-{secrets.token_hex(6).upper()}"

        withdrawal = WithdrawalRequest(
            wallet_id=wallet.id,
            amount=data.amount,
            bank_name=data.bank_name,
            account_number=data.account_number,
            account_name=data.account_name,
            bank_code=data.bank_code,
            status=WithdrawalStatus.PENDING,
            reference=ref,
        )
        db.add(withdrawal)
        await db.flush()

        # Immediate escrow debit entry against available balance
        await WalletService.record_ledger_entry(
            db,
            wallet_id=wallet.id,
            entry_type=LedgerEntryType.DEBIT,
            category=LedgerCategory.WITHDRAWAL,
            amount=data.amount,
            balance_type=BalanceType.AVAILABLE,
            description=f"Withdrawal request to {data.bank_name} ({data.account_number})",
            reference=f"LEDGER-{ref}",
        )

        await db.commit()
        await db.refresh(withdrawal)
        return withdrawal

    @staticmethod
    async def review_withdrawal(
        db: AsyncSession, withdrawal_id: UUID, admin_id: UUID, action: str, reason: Optional[str] = None
    ) -> WithdrawalRequest:
        """
        Administrative review for withdrawals.
        If approved: marks COMPLETED.
        If rejected: marks REJECTED and posts a compensating CREDIT entry to restore funds.
        """
        stmt = select(WithdrawalRequest).where(WithdrawalRequest.id == withdrawal_id)
        res = await db.execute(stmt)
        wd = res.scalar_one_or_none()

        if not wd:
            raise NotFoundException("Withdrawal request not found")

        if wd.status != WithdrawalStatus.PENDING:
            raise BadRequestException(f"Withdrawal has already been reviewed ({wd.status.value})")

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        wd.reviewed_by = admin_id
        wd.reviewed_at = now

        if action.lower() == "approve":
            wd.status = WithdrawalStatus.APPROVED
        elif action.lower() == "reject":
            wd.status = WithdrawalStatus.REJECTED
            wd.rejection_reason = reason or "Administrative rejection"

            # Post compensating CREDIT to restore the user's available balance
            await WalletService.record_ledger_entry(
                db,
                wallet_id=wd.wallet_id,
                entry_type=LedgerEntryType.CREDIT,
                category=LedgerCategory.ADJUSTMENT,
                amount=wd.amount,
                balance_type=BalanceType.AVAILABLE,
                description=f"Refund for rejected withdrawal {wd.reference}: {wd.rejection_reason}",
                reference=f"REFUND-{wd.reference}",
            )
        else:
            raise BadRequestException("Invalid review action; must be 'approve' or 'reject'")

        await db.commit()
        await db.refresh(wd)

        try:
            from app.notifications.service import NotificationService
            await NotificationService.dispatch_withdrawal_review(db, wd, action, reason)
        except Exception:
            pass

        return wd

    @staticmethod
    async def list_ledger_entries(
        db: AsyncSession, wallet_id: UUID, page: int = 1, size: int = 20
    ) -> Tuple[List[LedgerEntry], int]:
        stmt = select(LedgerEntry).where(LedgerEntry.wallet_id == wallet_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.scalar(count_stmt) or 0

        offset = (page - 1) * size
        stmt = stmt.order_by(LedgerEntry.created_at.desc()).offset(offset).limit(size)
        res = await db.execute(stmt)
        return list(res.scalars().all()), total

    @staticmethod
    async def list_all_withdrawals(
        db: AsyncSession,
        status: Optional[WithdrawalStatus] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[dict], int]:
        """
        Lists platform-wide withdrawal requests with associated user information.
        Used by Admin and Finance operators to inspect and process payouts.
        """
        stmt = (
            select(WithdrawalRequest, User)
            .join(Wallet, WithdrawalRequest.wallet_id == Wallet.id)
            .join(User, Wallet.user_id == User.id)
        )
        count_stmt = (
            select(func.count())
            .select_from(WithdrawalRequest)
            .join(Wallet, WithdrawalRequest.wallet_id == Wallet.id)
            .join(User, Wallet.user_id == User.id)
        )

        if status:
            stmt = stmt.where(WithdrawalRequest.status == status)
            count_stmt = count_stmt.where(WithdrawalRequest.status == status)

        total = await db.scalar(count_stmt) or 0
        offset = (page - 1) * size
        stmt = stmt.order_by(WithdrawalRequest.created_at.desc()).offset(offset).limit(size)
        res = await db.execute(stmt)
        rows = res.all()

        items = []
        for wd, u in rows:
            items.append({
                "id": wd.id,
                "wallet_id": wd.wallet_id,
                "user_id": u.id,
                "user_email": u.email,
                "user_name": u.full_name,
                "user_role": u.role.value if hasattr(u.role, "value") else str(u.role),
                "amount": wd.amount,
                "bank_name": wd.bank_name,
                "account_number": wd.account_number,
                "account_name": wd.account_name,
                "bank_code": wd.bank_code,
                "status": wd.status,
                "reference": wd.reference,
                "rejection_reason": wd.rejection_reason,
                "reviewed_by": wd.reviewed_by,
                "reviewed_at": wd.reviewed_at,
                "created_at": wd.created_at,
                "updated_at": wd.updated_at,
            })
        return items, total

    @staticmethod
    async def list_all_ledger_entries(
        db: AsyncSession,
        category: Optional[LedgerCategory] = None,
        entry_type: Optional[LedgerEntryType] = None,
        balance_type: Optional[BalanceType] = None,
        search: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[dict], int]:
        """
        Retrieves platform-wide immutable financial ledger entries with associated user details.
        Supports filtering by category, entry type, balance type, and search keyword.
        """
        stmt = (
            select(LedgerEntry, User)
            .join(Wallet, LedgerEntry.wallet_id == Wallet.id)
            .join(User, Wallet.user_id == User.id)
        )
        count_stmt = (
            select(func.count())
            .select_from(LedgerEntry)
            .join(Wallet, LedgerEntry.wallet_id == Wallet.id)
            .join(User, Wallet.user_id == User.id)
        )

        if category:
            stmt = stmt.where(LedgerEntry.category == category)
            count_stmt = count_stmt.where(LedgerEntry.category == category)

        if entry_type:
            stmt = stmt.where(LedgerEntry.entry_type == entry_type)
            count_stmt = count_stmt.where(LedgerEntry.entry_type == entry_type)

        if balance_type:
            stmt = stmt.where(LedgerEntry.balance_type == balance_type)
            count_stmt = count_stmt.where(LedgerEntry.balance_type == balance_type)

        if search:
            s = f"%{search.strip()}%"
            stmt = stmt.where(
                (LedgerEntry.reference.ilike(s)) |
                (LedgerEntry.description.ilike(s)) |
                (User.email.ilike(s)) |
                (User.full_name.ilike(s))
            )
            count_stmt = count_stmt.where(
                (LedgerEntry.reference.ilike(s)) |
                (LedgerEntry.description.ilike(s)) |
                (User.email.ilike(s)) |
                (User.full_name.ilike(s))
            )

        total = await db.scalar(count_stmt) or 0
        offset = (page - 1) * size
        stmt = stmt.order_by(LedgerEntry.created_at.desc()).offset(offset).limit(size)
        res = await db.execute(stmt)
        rows = res.all()

        items = []
        for entry, u in rows:
            items.append({
                "id": entry.id,
                "wallet_id": entry.wallet_id,
                "user_id": u.id,
                "user_email": u.email,
                "user_name": u.full_name,
                "user_role": u.role.value if hasattr(u.role, "value") else str(u.role),
                "order_id": entry.order_id,
                "vendor_order_id": entry.vendor_order_id,
                "delivery_task_id": entry.delivery_task_id,
                "entry_type": entry.entry_type,
                "category": entry.category,
                "amount": entry.amount,
                "balance_type": entry.balance_type,
                "description": entry.description,
                "reference": entry.reference,
                "created_at": entry.created_at,
            })
        return items, total

