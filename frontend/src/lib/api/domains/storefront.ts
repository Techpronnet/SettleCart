/**
 * SettleCart Storefront & Catalogue Domain API Module
 * 
 * Provides typed operations for browsing published stores, viewing store categories,
 * searching products across the marketplace, and inspecting product details.
 */

import { client, getBaseUrl } from '../client';
import {
  ApiError,
  type CategoryResponse,
  type ProductListResponse,
  type ProductResponse,
  type StoreListResponse,
  type StoreResponse,
} from '../types';

export interface PublicStoresParams {
  city?: string | null;
  page?: number;
  size?: number;
}

export interface StoreProductsParams {
  category_id?: string | null;
  search?: string | null;
  page?: number;
  size?: number;
}

export interface SearchProductsParams {
  q?: string;
  query?: string;
  page?: number;
  size?: number;
}

/**
 * Retrieves the paginated list of publicly published stores, optionally filtered by city.
 */
export async function getPublicStores(params?: PublicStoresParams): Promise<StoreListResponse> {
  const { data } = await client.GET('/api/v1/stores/public', {
    params: {
      query: {
        city: params?.city,
        page: params?.page,
        size: params?.size,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to retrieve public stores list');
  }

  return data;
}

/**
 * Retrieves details for a specific store by its unique UUID identifier.
 */
export async function getStore(storeId: string): Promise<StoreResponse> {
  const { data } = await client.GET('/api/v1/stores/{store_id}', {
    params: {
      path: {
        store_id: storeId,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Store with ID "${storeId}" not found`);
  }

  return data;
}

/**
 * Retrieves store details by SEO-friendly alphanumeric slug.
 */
export async function getStoreBySlug(slug: string): Promise<StoreResponse> {
  const { data } = await client.GET('/api/v1/stores/slug/{slug}', {
    params: {
      path: {
        slug,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Store with slug "${slug}" not found`);
  }

  return data;
}

/**
 * Lists product categories organized under a specific vendor store.
 */
export async function getCategories(storeId: string): Promise<CategoryResponse[]> {
  const { data } = await client.GET('/api/v1/catalogue/stores/{store_id}/categories', {
    params: {
      path: {
        store_id: storeId,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', `Failed to retrieve categories for store "${storeId}"`);
  }

  return data;
}

/**
 * Retrieves products belonging to a store, with optional category and search filters.
 */
export async function getStoreProducts(
  storeId: string,
  params?: StoreProductsParams
): Promise<ProductListResponse> {
  const { data } = await client.GET('/api/v1/catalogue/stores/{store_id}/products', {
    params: {
      path: {
        store_id: storeId,
      },
      query: {
        category_id: params?.category_id,
        search: params?.search,
        page: params?.page,
        size: params?.size,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', `Failed to retrieve products for store "${storeId}"`);
  }

  return data;
}

/**
 * Performs a global marketplace search across all products from all published stores.
 */
export async function searchProducts(params: SearchProductsParams): Promise<ProductListResponse> {
  const queryTerm = params.query || params.q || '';
  const { data } = await client.GET('/api/v1/catalogue/products/search', {
    params: {
      query: {
        query: queryTerm,
        page: params.page,
        size: params.size,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Product search returned empty response');
  }

  return data;
}

/**
 * Retrieves full details for a single product by its unique UUID identifier.
 */
export async function getProduct(productId: string): Promise<ProductResponse> {
  const { data } = await client.GET('/api/v1/catalogue/products/{product_id}', {
    params: {
      path: {
        product_id: productId,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Product with ID "${productId}" not found`);
  }

  return data;
}

export interface ShowcaseResponse {
  stores: StoreResponse[];
  products: ProductResponse[];
}

/**
 * Retrieves the aggregated showcase of top stores and trending products in 1 single request.
 * Uses a plain typed fetch because the endpoint postdates the generated schema.
 */
export async function getShowcase(): Promise<ShowcaseResponse> {
  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}/api/v1/stores/showcase`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server.');
  }
  if (!res.ok) {
    throw new ApiError(res.status, 'http_error', `Showcase request failed (${res.status}).`);
  }
  const data = (await res.json()) as ShowcaseResponse;
  if (!data || !Array.isArray(data.stores)) {
    throw new ApiError(500, 'internal_error', 'Showcase returned an unexpected response.');
  }
  return data;
}

export const storefront = {
  getPublicStores,
  getStore,
  getStoreBySlug,
  getCategories,
  getStoreProducts,
  searchProducts,
  getProduct,
  getShowcase,
};

export default storefront;
