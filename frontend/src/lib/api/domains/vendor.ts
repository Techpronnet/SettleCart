/**
 * SettleCart Vendor Domain API Module
 *
 * Typed operations for the vendor operating system:
 * - Businesses (create, list own, get, update, submit KYC)
 * - Stores management (create, get, update, publish, unpublish)
 * - Catalogue management (categories + products CRUD)
 * - Vendor orders (list per store, update fulfillment status)
 * - Wallet (balance, ledger, withdrawals)
 */

import { client, getBaseUrl } from '../client';
import { authStorage } from '../auth-storage';
import {
  ApiError,
  type BusinessCreateRequest,
  type BusinessResponse,
  type BusinessUpdateRequest,
  type CategoryCreateRequest,
  type CategoryResponse,
  type CategoryUpdateRequest,
  type CreateWithdrawalRequest,
  type LedgerListResponse,
  type ProductCreateRequest,
  type ProductResponse,
  type ProductUpdateRequest,
  type StoreCreateRequest,
  type StoreResponse,
  type StoreUpdateRequest,
  type VendorOrderResponse,
  type VendorOrderStatus,
  type WalletBalanceResponse,
  type WithdrawalResponse,
} from '../types';

// Businesses

export async function listMyBusinesses(): Promise<BusinessResponse[]> {
  const { data } = await client.GET('/api/v1/businesses/');
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve businesses');
  return data;
}

export async function createBusiness(payload: BusinessCreateRequest): Promise<BusinessResponse> {
  const { data } = await client.POST('/api/v1/businesses/', { body: payload });
  if (!data) throw new ApiError(500, 'internal_error', 'Business creation returned empty response');
  return data;
}

export async function getBusiness(businessId: string): Promise<BusinessResponse> {
  const { data } = await client.GET('/api/v1/businesses/{business_id}', {
    params: { path: { business_id: businessId } },
  });
  if (!data) throw new ApiError(404, 'not_found', `Business "${businessId}" not found`);
  return data;
}

export async function updateBusiness(
  businessId: string,
  payload: BusinessUpdateRequest
): Promise<BusinessResponse> {
  const { data } = await client.PATCH('/api/v1/businesses/{business_id}', {
    params: { path: { business_id: businessId } },
    body: payload,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Business update returned empty response');
  return data;
}

export async function submitKyc(businessId: string): Promise<BusinessResponse> {
  const { data } = await client.POST('/api/v1/businesses/{business_id}/kyc/submit', {
    params: { path: { business_id: businessId } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'KYC submission returned empty response');
  return data;
}

export type KycDocumentType = 'government_id' | 'cac_certificate';

export interface KycUploadResult {
  business_id: string;
  document_type: string;
  public_id: string;
  secure_url: string;
  message: string;
}

/**
 * Uploads a KYC document (multipart) for a business. Uses native fetch with
 * FormData so files stream correctly through the same-origin proxy.
 */
export async function uploadKycDocument(
  businessId: string,
  documentType: KycDocumentType,
  file: File
): Promise<KycUploadResult> {
  const token = authStorage.getToken();
  const form = new FormData();
  form.append('document_type', documentType);
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}/api/v1/media/upload/kyc/${businessId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Check your connection and try again.');
  }

  if (!res.ok) {
    let message = `Upload failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // keep default
    }
    throw new ApiError(res.status, res.status === 401 ? 'unauthorized' : 'upload_failed', message);
  }

  return (await res.json()) as KycUploadResult;
}

// Stores management

export async function createStore(payload: StoreCreateRequest): Promise<StoreResponse> {
  const { data } = await client.POST('/api/v1/stores/', { body: payload });
  if (!data) throw new ApiError(500, 'internal_error', 'Store creation returned empty response');
  return data;
}

export async function updateStore(
  storeId: string,
  payload: StoreUpdateRequest
): Promise<StoreResponse> {
  const { data } = await client.PATCH('/api/v1/stores/{store_id}', {
    params: { path: { store_id: storeId } },
    body: payload,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Store update returned empty response');
  return data;
}

export async function publishStore(storeId: string): Promise<StoreResponse> {
  const { data } = await client.POST('/api/v1/stores/{store_id}/publish', {
    params: { path: { store_id: storeId } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Store publish returned empty response');
  return data;
}

export async function unpublishStore(storeId: string): Promise<StoreResponse> {
  const { data } = await client.POST('/api/v1/stores/{store_id}/unpublish', {
    params: { path: { store_id: storeId } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Store unpublish returned empty response');
  return data;
}

// Catalogue management

export async function createCategory(
  storeId: string,
  payload: CategoryCreateRequest
): Promise<CategoryResponse> {
  const { data } = await client.POST('/api/v1/catalogue/stores/{store_id}/categories', {
    params: { path: { store_id: storeId } },
    body: payload,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Category creation returned empty response');
  return data;
}

export async function updateCategory(
  categoryId: string,
  payload: CategoryUpdateRequest
): Promise<CategoryResponse> {
  const { data } = await client.PATCH('/api/v1/catalogue/categories/{category_id}', {
    params: { path: { category_id: categoryId } },
    body: payload,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Category update returned empty response');
  return data;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await client.DELETE('/api/v1/catalogue/categories/{category_id}', {
    params: { path: { category_id: categoryId } },
  });
}

export async function createProduct(
  storeId: string,
  payload: ProductCreateRequest
): Promise<ProductResponse> {
  const { data } = await client.POST('/api/v1/catalogue/stores/{store_id}/products', {
    params: { path: { store_id: storeId } },
    body: payload,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Product creation returned empty response');
  return data;
}

export async function updateProduct(
  productId: string,
  payload: ProductUpdateRequest
): Promise<ProductResponse> {
  const { data } = await client.PATCH('/api/v1/catalogue/products/{product_id}', {
    params: { path: { product_id: productId } },
    body: payload,
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Product update returned empty response');
  return data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await client.DELETE('/api/v1/catalogue/products/{product_id}', {
    params: { path: { product_id: productId } },
  });
}

/**
 * Uploads one product photo (multipart) and appends it to the product gallery.
 * Returns the updated product.
 */
export async function uploadProductImage(productId: string, file: File): Promise<ProductResponse> {
  const token = authStorage.getToken();
  const form = new FormData();
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}/api/v1/media/upload/product/${productId}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Check your connection and try again.');
  }

  if (!res.ok) {
    let message = `Photo upload failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // keep default
    }
    throw new ApiError(res.status, res.status === 401 ? 'unauthorized' : 'upload_failed', message);
  }

  return (await res.json()) as ProductResponse;
}

// Vendor orders

export async function listVendorOrders(
  storeId: string,
  page = 1,
  size = 20
): Promise<VendorOrderResponse[]> {
  const { data } = await client.GET('/api/v1/orders/vendor/{store_id}', {
    params: { path: { store_id: storeId }, query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve vendor orders');
  return data;
}

export async function updateVendorOrderStatus(
  vendorOrderId: string,
  status: VendorOrderStatus
): Promise<VendorOrderResponse> {
  const { data } = await client.PATCH('/api/v1/orders/vendor-orders/{vendor_order_id}/status', {
    params: { path: { vendor_order_id: vendorOrderId } },
    body: { status },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Order status update returned empty response');
  return data;
}

// Wallet

export async function getMyWallet(): Promise<WalletBalanceResponse> {
  const { data } = await client.GET('/api/v1/wallets/me');
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve wallet balance');
  return data;
}

export async function getMyLedger(page = 1, size = 20): Promise<LedgerListResponse> {
  const { data } = await client.GET('/api/v1/wallets/ledger', {
    params: { query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve ledger');
  return data;
}

export async function requestWithdrawal(
  payload: CreateWithdrawalRequest
): Promise<WithdrawalResponse> {
  const { data } = await client.POST('/api/v1/wallets/withdraw', { body: payload });
  if (!data) throw new ApiError(500, 'internal_error', 'Withdrawal request returned empty response');
  return data;
}

export async function listMyWithdrawals(): Promise<WithdrawalResponse[]> {
  const { data } = await client.GET('/api/v1/wallets/withdrawals/my');
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve withdrawals');
  return data;
}

export const vendor = {
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
  uploadProductImage,
  listVendorOrders,
  updateVendorOrderStatus,
  getMyWallet,
  getMyLedger,
  requestWithdrawal,
  listMyWithdrawals,
};

export default vendor;
