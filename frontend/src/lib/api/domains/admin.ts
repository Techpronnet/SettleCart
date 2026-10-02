/**
 * SettleCart Admin Domain API Module
 *
 * Operations-center capabilities for platform administrators:
 * - Dashboard stats, KYC queue + review, all orders, users, businesses, stores
 * - Rider assignment, manual settlement, withdrawal review, payment lookup
 */

import { client } from '../client';
import {
  ApiError,
  type AdminCreateUserRequest,
  type AssignRiderRequest,
  type BusinessResponse,
  type DashboardStats,
  type DeliveryTaskDetailResponse,
  type DeliveryTaskListResponse,
  type DeliveryTaskResponse,
  type DeliveryTaskStatus,
  type KYCReviewRequest,
  type KYCReviewResponse,
  type KYCStatus,
  type LedgerEntryResponse,
  type OrderListResponse,
  type OrderResponse,
  type OrderStatus,
  type PaymentTransactionResponse,
  type StoreResponse,
  type UserListResponse,
  type UserResponse,
  type WithdrawalResponse,
  type WithdrawalReviewRequest,
  type WithdrawalListResponse,
  type AdminLedgerListResponse,
  type ResolveDisputeRequest,
} from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await client.GET('/api/v1/admin/dashboard');
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve dashboard stats');
  return data;
}

export interface PendingKycResponse {
  businesses: BusinessResponse[];
  total: number;
  page: number;
  size: number;
}

export async function listPendingKyc(page = 1, size = 20): Promise<PendingKycResponse> {
  const { data } = await client.GET('/api/v1/admin/kyc/pending', {
    params: { query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve KYC queue');
  return data as PendingKycResponse;
}

export async function reviewKyc(
  businessId: string,
  decision: KYCStatus,
  notes?: string | null
): Promise<KYCReviewResponse> {
  const body: KYCReviewRequest = { business_id: businessId, decision, notes: notes ?? null };
  const { data } = await client.POST('/api/v1/admin/kyc/review', { body });
  if (!data) throw new ApiError(500, 'internal_error', 'KYC review returned empty response');
  return data;
}

export async function listAllOrders(
  status?: OrderStatus | null,
  page = 1,
  size = 20
): Promise<OrderListResponse> {
  const { data } = await client.GET('/api/v1/admin/orders', {
    params: { query: { status: status ?? undefined, page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve orders');
  return data;
}

export async function listAdminUsers(page = 1, size = 20): Promise<UserListResponse> {
  const { data } = await client.GET('/api/v1/admin/users', {
    params: { query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve users');
  return data as UserListResponse;
}

export async function getAnyUser(userId: string): Promise<UserResponse> {
  const { data } = await client.GET('/api/v1/users/{user_id}', {
    params: { path: { user_id: userId } },
  });
  if (!data) throw new ApiError(404, 'not_found', `User "${userId}" not found`);
  return data;
}

export async function createUserByAdmin(payload: AdminCreateUserRequest): Promise<UserResponse> {
  const { data } = await client.POST('/api/v1/admin/users', { body: payload });
  if (!data) throw new ApiError(500, 'internal_error', 'User creation returned empty response');
  return data;
}

export interface AdminBusinessListResponse {
  businesses: BusinessResponse[];
  total: number;
  page: number;
  size: number;
}

export async function listAdminBusinesses(page = 1, size = 20): Promise<AdminBusinessListResponse> {
  const { data } = await client.GET('/api/v1/admin/businesses', {
    params: { query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve businesses');
  return data as AdminBusinessListResponse;
}

export interface AdminStoreListResponse {
  stores: StoreResponse[];
  total: number;
  page: number;
  size: number;
}

export async function listAdminStores(page = 1, size = 20): Promise<AdminStoreListResponse> {
  const { data } = await client.GET('/api/v1/admin/stores', {
    params: { query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve stores');
  return data as AdminStoreListResponse;
}

export async function listAllDeliveryTasks(
  status?: DeliveryTaskStatus | null,
  city?: string | null,
  page = 1,
  size = 20
): Promise<DeliveryTaskListResponse> {
  const { data } = await client.GET('/api/v1/dispatch/tasks/', {
    params: { query: { status: status ?? undefined, city: city ?? undefined, page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve delivery tasks');
  return data;
}

export async function getAnyTask(taskId: string): Promise<DeliveryTaskDetailResponse> {
  const { data } = await client.GET('/api/v1/dispatch/tasks/{task_id}', {
    params: { path: { task_id: taskId } },
  });
  if (!data) throw new ApiError(404, 'not_found', `Delivery task "${taskId}" not found`);
  return data;
}

export interface SignedUrl {
  signed_url: string;
  expires_in_seconds: number;
}

/**
 * Fetches a short-lived signed URL for a confidential KYC document.
 * URLs expire (default 1h) so they are fetched on demand, never stored.
 */
export async function getKycDocumentUrl(
  businessId: string,
  documentType: 'government_id' | 'cac_certificate'
): Promise<SignedUrl> {
  const { data } = await client.GET('/api/v1/media/kyc/{business_id}/{document_type}/signed-url', {
    params: { path: { business_id: businessId, document_type: documentType } },
  });
  if (!data) throw new ApiError(404, 'not_found', 'Document not available.');
  return data as SignedUrl;
}

export async function assignRider(taskId: string, riderId: string): Promise<DeliveryTaskResponse> {
  const body: AssignRiderRequest = { rider_id: riderId };
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/assign', {
    params: { path: { task_id: taskId } },
    body,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Rider assignment returned empty response');
  return data;
}

export async function settleVendorOrder(vendorOrderId: string): Promise<LedgerEntryResponse[]> {
  const { data } = await client.POST('/api/v1/wallets/settle/{vendor_order_id}', {
    params: { path: { vendor_order_id: vendorOrderId } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Settlement returned empty response');
  return data;
}

export async function reviewWithdrawal(
  withdrawalId: string,
  action: string,
  reason?: string | null
): Promise<WithdrawalResponse> {
  const body: WithdrawalReviewRequest = { action, reason: reason ?? null };
  const { data } = await client.POST('/api/v1/wallets/withdrawals/{withdrawal_id}/review', {
    params: { path: { withdrawal_id: withdrawalId } },
    body,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Withdrawal review returned empty response');
  return data;
}

export async function getOrderPayments(orderId: string): Promise<PaymentTransactionResponse[]> {
  const { data } = await client.GET('/api/v1/payments/order/{order_id}', {
    params: { path: { order_id: orderId } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve payments');
  return data;
}

export async function getAnyOrder(orderId: string): Promise<OrderResponse> {
  const { data } = await client.GET('/api/v1/orders/{order_id}', {
    params: { path: { order_id: orderId } },
  });
  if (!data) throw new ApiError(404, 'not_found', `Order "${orderId}" not found`);
  return data;
}

export async function listAdminWithdrawals(
  status?: string,
  page = 1,
  size = 20
): Promise<WithdrawalListResponse> {
  const query: Record<string, string | number> = { page, size };
  if (status && status !== 'all') query.status = status;
  const { data } = await (client.GET as any)('/api/v1/admin/withdrawals', {
    params: { query },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve withdrawals queue');
  return data as WithdrawalListResponse;
}

export async function resolveDispute(
  orderId: string,
  action: 'refund' | 'dismiss',
  resolutionNotes?: string | null
): Promise<OrderResponse> {
  const body: ResolveDisputeRequest = { action, resolution_notes: resolutionNotes ?? null };
  const { data } = await (client.POST as any)('/api/v1/admin/orders/{order_id}/dispute/resolve', {
    params: { path: { order_id: orderId } },
    body,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Dispute resolution failed');
  return data as OrderResponse;
}

export interface AdminLedgerFilterParams {
  category?: string;
  entry_type?: string;
  balance_type?: string;
  search?: string;
  page?: number;
  size?: number;
}

export async function listAdminLedger(
  params: AdminLedgerFilterParams = {}
): Promise<AdminLedgerListResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    size: params.size ?? 20,
  };
  if (params.category && params.category !== 'all') query.category = params.category;
  if (params.entry_type && params.entry_type !== 'all') query.entry_type = params.entry_type;
  if (params.balance_type && params.balance_type !== 'all') query.balance_type = params.balance_type;
  if (params.search?.trim()) query.search = params.search.trim();

  const { data } = await (client.GET as any)('/api/v1/admin/ledger', {
    params: { query },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve ledger entries');
  return data as AdminLedgerListResponse;
}

export const admin = {
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
  getKycDocumentUrl,
  assignRider,
  settleVendorOrder,
  reviewWithdrawal,
  listAdminWithdrawals,
  resolveDispute,
  listAdminLedger,
  getOrderPayments,
  getAnyOrder,
};

export default admin;
