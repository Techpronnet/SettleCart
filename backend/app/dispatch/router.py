from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, DeliveryTaskStatus
from app.dispatch.schemas import (
    DeliveryTaskResponse,
    DeliveryTaskDetailResponse,
    CustomerVerificationCodeResponse,
    AssignRiderRequest,
    VerifyDeliveryCodeRequest,
    ReportDeliveryFailureRequest,
    DeliveryTaskListResponse,
    UpdateRiderLocationRequest,
    RiderLocationResponse,
)
from app.dispatch.service import DispatchService
from app.core.exceptions import ForbiddenException
from app.core.config import settings
from app.core.limiter import limiter

router = APIRouter(prefix="/tasks")

@router.get("/available", response_model=DeliveryTaskListResponse)
async def list_available_tasks(
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH, UserRole.ADMIN)),
):
    """List pending delivery tasks ready for dispatch assignment or self-acceptance."""
    tasks, total = await DispatchService.list_available_tasks(db, city=city, page=page, size=size)
    return DeliveryTaskListResponse(tasks=tasks, total=total, page=page, size=size)

@router.get("/my", response_model=DeliveryTaskListResponse)
async def list_my_tasks(
    status: Optional[DeliveryTaskStatus] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH)),
):
    """List delivery tasks assigned to the authenticated dispatch rider."""
    tasks, total = await DispatchService.list_rider_tasks(db, rider_id=current_user.id, status=status, page=page, size=size)
    return DeliveryTaskListResponse(tasks=tasks, total=total, page=page, size=size)

@router.post("/from-vendor-order/{vendor_order_id}", response_model=DeliveryTaskResponse, status_code=201)
async def create_delivery_task(
    vendor_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a delivery task from a vendor order.
    Allowed by the vendor who owns the store, or an Admin.
    """
    return await DispatchService.create_delivery_task(db, vendor_order_id=vendor_order_id)

@router.get("/{task_id}", response_model=DeliveryTaskDetailResponse)
async def get_task_detail(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns full delivery task information.
    Accessible by the assigned rider, customer, vendor, or admin.
    """
    task = await DispatchService.get_task(db, task_id=task_id)

    is_customer = task.order.customer_id == current_user.id
    is_rider = task.rider_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    is_vendor = (
        task.vendor_order
        and task.vendor_order.store
        and task.vendor_order.store.business
        and task.vendor_order.store.business.owner_id == current_user.id
    )

    if not (is_customer or is_rider or is_admin or is_vendor):
        raise ForbiddenException("You are not authorized to view this delivery task")

    return DeliveryTaskDetailResponse(
        id=task.id,
        order_id=task.order_id,
        vendor_order_id=task.vendor_order_id,
        rider_id=task.rider_id,
        status=task.status,
        pickup_address=task.pickup_address,
        pickup_city=task.pickup_city,
        pickup_phone=task.pickup_phone,
        dropoff_address=task.dropoff_address,
        dropoff_city=task.dropoff_city,
        dropoff_phone=task.dropoff_phone,
        delivery_fee=task.delivery_fee,
        dispatch_earnings=task.dispatch_earnings,
        assigned_at=task.assigned_at,
        accepted_at=task.accepted_at,
        picked_up_at=task.picked_up_at,
        delivered_at=task.delivered_at,
        failed_at=task.failed_at,
        failure_reason=task.failure_reason,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        order_number=task.order.order_number if task.order else None,
        store_name=task.vendor_order.store.name if task.vendor_order and task.vendor_order.store else None,
        rider_name=task.rider.full_name if task.rider else None,
        rider_phone=task.rider.phone if task.rider else None,
    )

@router.get("/{task_id}/verification-code", response_model=CustomerVerificationCodeResponse)
async def get_customer_verification_code(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    SRS v1.1 Secure OTP Delivery:
    Returns the handover verification code strictly to the customer who placed the order or an Admin.
    Dispatch riders are strictly forbidden from viewing this endpoint.
    """
    return await DispatchService.get_customer_verification_code(db, task_id=task_id, user=current_user)

@router.post("/{task_id}/assign", response_model=DeliveryTaskResponse)
async def assign_rider(
    task_id: UUID,
    data: AssignRiderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Assigns an authorized dispatch rider to a delivery task (Admin only)."""
    return await DispatchService.assign_rider(db, task_id=task_id, rider_id=data.rider_id)

@router.post("/{task_id}/accept", response_model=DeliveryTaskResponse)
async def accept_assignment(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH)),
):
    """Rider accepts an assigned delivery task."""
    return await DispatchService.accept_task(db, task_id=task_id, rider_id=current_user.id)

@router.post("/{task_id}/pickup", response_model=DeliveryTaskResponse)
async def confirm_pickup(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH)),
):
    """Rider confirms package pickup from the vendor store."""
    return await DispatchService.confirm_pickup(db, task_id=task_id, rider_id=current_user.id)

@router.post("/{task_id}/start", response_model=DeliveryTaskResponse)
async def start_delivery(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH)),
):
    """Rider marks delivery as IN_TRANSIT to customer destination."""
    return await DispatchService.start_delivery(db, task_id=task_id, rider_id=current_user.id)

@router.post("/{task_id}/verify-delivery", response_model=DeliveryTaskResponse)
@limiter.limit(settings.RATE_LIMIT_VERIFY_DELIVERY)
async def verify_and_complete_delivery(
    request: Request,
    task_id: UUID,
    data: VerifyDeliveryCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH)),
):
    """
    SRS v1.1 Handover Verification:
    The dispatch rider enters the customer's 6-digit OTP code to verify receipt.
    Upon successful validation, transitions task and order to DELIVERED.
    """
    return await DispatchService.verify_and_complete_delivery(
        db, task_id=task_id, rider_id=current_user.id, submitted_code=data.code
    )

@router.post("/{task_id}/location", response_model=RiderLocationResponse)
async def update_rider_location(
    task_id: UUID,
    data: UpdateRiderLocationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH, UserRole.ADMIN)),
):
    """
    Rider GPS Telemetry Broadcast:
    Receives current coordinates and streams them in real-time to active tracking listeners.
    """
    location = await DispatchService.update_rider_location(
        db,
        task_id=task_id,
        rider_id=current_user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        heading=data.heading,
        speed=data.speed,
    )
    return RiderLocationResponse(**location)

@router.post("/{task_id}/fail", response_model=DeliveryTaskResponse)
async def report_delivery_failure(
    task_id: UUID,
    data: ReportDeliveryFailureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DISPATCH, UserRole.ADMIN)),
):
    """Reports a failed delivery attempt with operational reason."""
    return await DispatchService.report_failure(
        db, task_id=task_id, rider_id=current_user.id, reason=data.reason, notes=data.notes
    )

@router.get("", response_model=DeliveryTaskListResponse)
@router.get("/", response_model=DeliveryTaskListResponse)
async def list_all_tasks(
    status: Optional[DeliveryTaskStatus] = None,
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE)),
):
    """Platform administration view: list all delivery tasks across all statuses and regions."""
    tasks, total = await DispatchService.list_all_tasks(db, status=status, city=city, page=page, size=size)
    return DeliveryTaskListResponse(tasks=tasks, total=total, page=page, size=size)
