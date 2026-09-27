/**
 * SettleCart TypeScript API Client & SDK
 * 
 * Unified entry point providing:
 * - openapi-fetch client and typed HTTP shortcuts (GET, POST, PUT, PATCH, DELETE)
 * - Isomorphic token storage manager (authStorage)
 * - Error envelopes and ApiError exception class
 * - Fully typed domain modules (auth, storefront, orders, dispatch, realtime)
 * - All OpenAPI schema types and response models
 */

// Storage
export {
  authStorage,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  type AuthStorage,
} from './auth-storage';

// Types & Error Handling
export {
  ApiError,
  friendlyApiMessage,
  type paths,
  type operations,
  type components,
  type Schema,
  type AppException,
  type ErrorEnvelope,
  type ValidationError,
  type TokenResponse,
  type UserResponse,
  type UserRole,
  type RegisterRequest,
  type RefreshRequest,
  type UserUpdateRequest,
  type StoreResponse,
  type StoreListResponse,
  type StoreCreateRequest,
  type StoreUpdateRequest,
  type CategoryResponse,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
  type ProductResponse,
  type ProductListResponse,
  type ProductCreateRequest,
  type ProductUpdateRequest,
  type OrderResponse,
  type OrderListResponse,
  type CreateOrderRequest,
  type VendorOrderResponse,
  type OrderItemResponse,
  type OrderStatus,
  type VendorOrderStatus,
  type InitializePaymentRequest,
  type InitializePaymentResponse,
  type PaymentTransactionResponse,
  type WalletBalanceResponse,
  type LedgerEntryResponse,
  type LedgerListResponse,
  type WithdrawalResponse,
  type WithdrawalReviewRequest,
  type CreateWithdrawalRequest,
  type BusinessResponse,
  type BusinessCreateRequest,
  type BusinessUpdateRequest,
  type KYCStatus,
  type KYCReviewRequest,
  type KYCReviewResponse,
  type DashboardStats,
  type UserListResponse,
  type AdminCreateUserRequest,
  type DeliveryTaskResponse,
  type DeliveryTaskDetailResponse,
  type DeliveryTaskListResponse,
  type DeliveryTaskStatus,
  type CustomerVerificationCodeResponse,
  type VerifyDeliveryCodeRequest,
  type UpdateRiderLocationRequest,
  type RiderLocationResponse,
  type ReportDeliveryFailureRequest,
  type TicketResponse,
  type TrackingSummaryResponse,
  type NotificationResponse,
  type NotificationListResponse,
  type NotificationEventType,
  type RealtimeEventType,
  type TrackingConnectedEvent,
  type OrderStatusChangedEvent,
  type VendorOrderStatusChangedEvent,
  type DispatchTaskUpdatedEvent,
  type RiderLocationUpdatedEvent,
  type DeliveryCompletedEvent,
  type RealtimeOrderEvent,
} from './types';

// Core Client
export {
  client,
  api,
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  getBaseUrl,
  DEFAULT_API_URL,
} from './client';

// Auth Domain Module
export {
  auth,
  login,
  register,
  refresh,
  getCurrentUser,
  logout,
  type LoginCredentials,
} from './domains/auth';

// Storefront & Catalogue Domain Module
export {
  storefront,
  getPublicStores,
  getStore,
  getStoreBySlug,
  getCategories,
  getStoreProducts,
  searchProducts,
  getProduct,
  type PublicStoresParams,
  type StoreProductsParams,
  type SearchProductsParams,
} from './domains/storefront';

// Orders & Payments Domain Module
export {
  orders,
  createOrder,
  getOrder,
  listMyOrders,
  initializePayment,
  verifyPayment,
} from './domains/orders';

// Dispatch & Operations Domain Module
export {
  dispatch,
  getAvailableTasks,
  getMyTasks,
  getTask,
  getVerificationCode,
  acceptTask,
  pickupTask,
  startDelivery,
  verifyDeliveryOtp,
  updateRiderLocation,
  failTask,
  type AvailableTasksParams,
  type MyTasksParams,
} from './domains/dispatch';

// Vendor Domain Module
export {
  vendor,
  listMyBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
  submitKyc,
  createStore,
  updateStore,
  publishStore,
  unpublishStore,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  listVendorOrders,
  updateVendorOrderStatus,
  getMyWallet,
  getMyLedger,
  requestWithdrawal,
  listMyWithdrawals,
  uploadKycDocument,
  type KycDocumentType,
  type KycUploadResult,
} from './domains/vendor';

// Realtime & Live Tracking Domain Module
export {
  notifications,
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from './domains/notifications';
export {
  realtime,
  getRealtimeTicket,
  getTrackingSummary,
  connectOrderWebSocket,
  subscribeOrderLiveTracking,
  type WebSocketConnectionOptions,
  type WebSocketConnection,
  type LiveTrackingSubscriptionOptions,
} from './domains/realtime';

// Admin Domain Module
export {
  admin,
  getDashboardStats,
  listPendingKyc,
  reviewKyc,
  listAllOrders,
  listAdminUsers,
  getAnyUser,
  createUserByAdmin,
  listAdminBusinesses,
  listAdminStores,
  listAllDeliveryTasks,
  getAnyTask,
  assignRider,
  settleVendorOrder,
  reviewWithdrawal,
  getOrderPayments,
  getAnyOrder,
  type PendingKycResponse,
  type AdminBusinessListResponse,
  type AdminStoreListResponse,
} from './domains/admin';
import { authStorage } from './auth-storage';
import { api, client } from './client';
import { auth } from './domains/auth';
import { dispatch } from './domains/dispatch';
import { orders } from './domains/orders';
import { realtime } from './domains/realtime';
import { notifications } from './domains/notifications';
import { admin } from './domains/admin';
import { vendor } from './domains/vendor';
import { storefront } from './domains/storefront';
import { ApiError } from './types';

/**
 * Unified SDK object bundling all domain modules, client, and utilities.
 */
export const sdk = {
  client,
  api,
  authStorage,
  ApiError,
  auth,
  storefront,
  orders,
  dispatch,
  realtime,
  notifications,
  vendor,
  admin,
};

export default sdk;
