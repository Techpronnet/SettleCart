import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"
    DISPATCH = "dispatch"
    ADMIN = "admin"
    FINANCE = "finance"

class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"

class OrderStatus(str, enum.Enum):
    CREATED = "created"
    PAYMENT_PENDING = "payment_pending"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PROCESSING = "processing"
    PARTIALLY_READY = "partially_ready"
    READY_FOR_PICKUP = "ready_for_pickup"
    DISPATCH_ASSIGNED = "dispatch_assigned"
    PICKED_UP = "picked_up"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    SETTLED = "settled"
    PAYMENT_FAILED = "payment_failed"
    CANCELLED = "cancelled"
    REFUND_PENDING = "refund_pending"
    REFUNDED = "refunded"
    DISPUTED = "disputed"

class VendorOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    SETTLED = "settled"
    CANCELLED = "cancelled"

class DeliveryTaskStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    ABANDONED = "abandoned"
    REFUNDED = "refunded"

class LedgerEntryType(str, enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"

class LedgerCategory(str, enum.Enum):
    VENDOR_EARNINGS = "vendor_earnings"
    DISPATCH_EARNINGS = "dispatch_earnings"
    PLATFORM_FEE = "platform_fee"
    WITHDRAWAL = "withdrawal"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"

class BalanceType(str, enum.Enum):
    PENDING = "pending"
    AVAILABLE = "available"

class WithdrawalStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"

class NotificationEventType(str, enum.Enum):
    ORDER_CREATED = "order_created"
    PAYMENT_CONFIRMED = "payment_confirmed"
    ORDER_CANCELLED = "order_cancelled"
    VENDOR_ORDER_ASSIGNED = "vendor_order_assigned"
    DISPATCH_ASSIGNED = "dispatch_assigned"
    DELIVERY_OTP_GENERATED = "delivery_otp_generated"
    DELIVERY_PICKED_UP = "delivery_picked_up"
    DELIVERY_IN_TRANSIT = "delivery_in_transit"
    DELIVERY_COMPLETED = "delivery_completed"
    DELIVERY_FAILED = "delivery_failed"
    SETTLEMENT_CREDITED = "settlement_credited"
    WITHDRAWAL_REQUESTED = "withdrawal_requested"
    WITHDRAWAL_PROCESSED = "withdrawal_processed"
    KYC_REVIEWED = "kyc_reviewed"
    GENERAL = "general"



