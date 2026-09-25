/**
 * SettleCart API Type Definitions & Error Envelope
 * 
 * Re-exports core schema types generated from OpenAPI 3.1 and defines
 * the authoritative ApiError class for structured exception handling.
 */

import type { components, operations, paths } from './schema';

/**
 * Authoritative API error class for all HTTP and application exceptions.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintain proper stack trace in V8 / Node / browsers
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Helper to check if this error represents an authentication failure.
   */
  public get isUnauthorized(): boolean {
    return this.status === 401 || this.code === 'unauthorized';
  }

  /**
   * Helper to check if this error represents a forbidden action.
   */
  public get isForbidden(): boolean {
    return this.status === 403 || this.code === 'forbidden';
  }

  /**
   * Helper to check if this error represents a resource not found.
   */
  public get isNotFound(): boolean {
    return this.status === 404 || this.code === 'not_found';
  }

  /**
   * Helper to check if this error represents a validation failure.
   */
  public get isValidationError(): boolean {
    return this.status === 422 || this.code === 'validation_error';
  }

  /**
   * Helper to check if this error was caused by rate limiting.
   */
  public get isRateLimited(): boolean {
    return this.status === 429 || this.code === 'rate_limit_exceeded';
  }
}

/**
 * Extracts the most useful human-readable message from an API failure.
 * The backend wraps Pydantic validation failures in a generic message with
 * per-field reasons in `details`, so surface the first field reason instead,
 * naming the offending field from the error location.
 */
export function friendlyApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const details = err.details;
    if (Array.isArray(details)) {
      for (const entry of details) {
        if (entry && typeof entry === 'object' && 'msg' in entry) {
          const raw = String((entry as { msg?: unknown }).msg ?? '').replace(
            /^Value error,\s*/i,
            ''
          );
          if (!raw) continue;
          const loc = (entry as { loc?: unknown }).loc;
          if (Array.isArray(loc) && loc.length === 1 && loc[0] === 'body') {
            return 'Your request arrived empty. Reload the page and try again.';
          }
          const field = fieldLabel(loc);
          if (!field) return raw;
          if (/^(field required|missing)$/i.test(raw.trim())) {
            return `Please provide your ${field}.`;
          }
          const capped = field.charAt(0).toUpperCase() + field.slice(1);
          return `${capped}: ${raw.charAt(0).toLowerCase() + raw.slice(1)}`;
        }
      }
    }
    if (typeof details === 'string' && details) return details;
    if (err.message) return err.message;
  }
  return fallback;
}

function fieldLabel(loc: unknown): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  const last = loc[loc.length - 1];
  if (typeof last !== 'string' && typeof last !== 'number') return null;
  const s = String(last);
  if (s === 'body' || s === '__root__') return null;
  return s.replace(/_/g, ' ');
}

// Re-export OpenAPI paths and components
export type { paths, operations, components };
export type Schema = components['schemas'];

// Core Error Envelopes
export type AppException = Schema['AppException'];
export type ErrorEnvelope = Schema['ErrorEnvelope'];
export type ValidationError = Schema['HTTPValidationError'];

// Auth & Users
export type TokenResponse = Schema['TokenResponse'];
export type UserResponse = Schema['UserResponse'];
export type UserRole = Schema['UserRole'];
export type UserListResponse = Schema['UserListResponse'];
export type RegisterRequest = Schema['RegisterRequest'];
export type RefreshRequest = Schema['RefreshRequest'];
export type UserUpdateRequest = Schema['UserUpdateRequest'];
export type AdminCreateUserRequest = Schema['AdminCreateUserRequest'];

// Storefront & Catalogue
export type StoreResponse = Schema['StoreResponse'];
export type StoreListResponse = Schema['StoreListResponse'];
export type StoreCreateRequest = Schema['StoreCreateRequest'];
export type StoreUpdateRequest = Schema['StoreUpdateRequest'];
export type CategoryResponse = Schema['CategoryResponse'];
export type CategoryCreateRequest = Schema['CategoryCreateRequest'];
export type CategoryUpdateRequest = Schema['CategoryUpdateRequest'];
export type ProductResponse = Schema['ProductResponse'];
export type ProductListResponse = Schema['ProductListResponse'];
export type ProductCreateRequest = Schema['ProductCreateRequest'];
export type ProductUpdateRequest = Schema['ProductUpdateRequest'];

// Businesses
export type BusinessResponse = Schema['BusinessResponse'];
export type BusinessCreateRequest = Schema['BusinessCreateRequest'];
export type BusinessUpdateRequest = Schema['BusinessUpdateRequest'];
export type KYCStatus = Schema['KYCStatus'];
export type KYCReviewRequest = Schema['KYCReviewRequest'];
export type KYCReviewResponse = Schema['KYCReviewResponse'];

// Orders & Payments
export type OrderResponse = Schema['OrderResponse'];
export type OrderListResponse = Schema['OrderListResponse'];
export type CreateOrderRequest = Schema['CreateOrderRequest'];
export type VendorOrderResponse = Schema['VendorOrderResponse'];
export type OrderItemResponse = Schema['OrderItemResponse'];
export type OrderStatus = Schema['OrderStatus'];
export type VendorOrderStatus = Schema['VendorOrderStatus'];
export type InitializePaymentRequest = Schema['InitializePaymentRequest'];
export type InitializePaymentResponse = Schema['InitializePaymentResponse'];
export type PaymentTransactionResponse = Schema['PaymentTransactionResponse'];

// Wallet & Settlement
export type WalletBalanceResponse = Schema['WalletBalanceResponse'];
export type DashboardStats = Schema['DashboardStats'];
export type LedgerEntryResponse = Schema['LedgerEntryResponse'];
export type LedgerListResponse = Schema['LedgerListResponse'];
export type WithdrawalResponse = Schema['WithdrawalResponse'];
export type WithdrawalReviewRequest = Schema['WithdrawalReviewRequest'];
export type CreateWithdrawalRequest = Schema['CreateWithdrawalRequest'];

// Dispatch & Operations
export type DeliveryTaskResponse = Schema['DeliveryTaskResponse'];
export type DeliveryTaskDetailResponse = Schema['DeliveryTaskDetailResponse'];
export type AssignRiderRequest = Schema['AssignRiderRequest'];
export type DeliveryTaskListResponse = Schema['DeliveryTaskListResponse'];
export type DeliveryTaskStatus = Schema['DeliveryTaskStatus'];
export type CustomerVerificationCodeResponse = Schema['CustomerVerificationCodeResponse'];
export type VerifyDeliveryCodeRequest = Schema['VerifyDeliveryCodeRequest'];
export type UpdateRiderLocationRequest = Schema['UpdateRiderLocationRequest'];
export type RiderLocationResponse = Schema['RiderLocationResponse'];
export type ReportDeliveryFailureRequest = Schema['ReportDeliveryFailureRequest'];

// Realtime & Live Tracking
export type TicketResponse = Schema['TicketResponse'];
export type TrackingSummaryResponse = Schema['TrackingSummaryResponse'];
export type NotificationResponse = Schema['NotificationResponse'];
export type NotificationListResponse = Schema['NotificationListResponse'];
export type NotificationEventType = Schema['NotificationEventType'];

// Realtime Streaming Event Payloads
export type RealtimeEventType =
  | 'TRACKING_CONNECTED'
  | 'ORDER_STATUS_CHANGED'
  | 'VENDOR_ORDER_STATUS_CHANGED'
  | 'DISPATCH_TASK_UPDATED'
  | 'RIDER_LOCATION_UPDATED'
  | 'DELIVERY_COMPLETED';

export interface TrackingConnectedEvent {
  event_type: 'TRACKING_CONNECTED';
  order_id: string;
  timestamp: string;
  data: TrackingSummaryResponse;
}

export interface OrderStatusChangedEvent {
  event_type: 'ORDER_STATUS_CHANGED';
  order_id: string;
  timestamp: string;
  data: {
    order_id: string;
    status: OrderStatus;
    previous_status?: OrderStatus;
  };
}

export interface VendorOrderStatusChangedEvent {
  event_type: 'VENDOR_ORDER_STATUS_CHANGED';
  order_id: string;
  timestamp: string;
  data: {
    vendor_order_id: string;
    store_id: string;
    status: VendorOrderStatus;
  };
}

export interface DispatchTaskUpdatedEvent {
  event_type: 'DISPATCH_TASK_UPDATED';
  order_id: string;
  timestamp: string;
  data: {
    task_id: string;
    status: DeliveryTaskStatus;
    rider_id?: string | null;
  };
}

export interface RiderLocationUpdatedEvent {
  event_type: 'RIDER_LOCATION_UPDATED';
  order_id: string;
  timestamp: string;
  data: {
    task_id: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    updated_at: string;
  };
}

export interface DeliveryCompletedEvent {
  event_type: 'DELIVERY_COMPLETED';
  order_id: string;
  timestamp: string;
  data: {
    task_id: string;
    delivered_at: string;
  };
}

export type RealtimeOrderEvent =
  | TrackingConnectedEvent
  | OrderStatusChangedEvent
  | VendorOrderStatusChangedEvent
  | DispatchTaskUpdatedEvent
  | RiderLocationUpdatedEvent
  | DeliveryCompletedEvent;
