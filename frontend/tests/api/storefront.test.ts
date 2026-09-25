/**
 * Tier 1 & Tier 2 Tests: Storefront & Catalogue Domain API (F5)
 * 
 * Verifies public store listings, city filtering, store lookup by UUID/slug,
 * store categories, store product pagination, global product search, and product details.
 */

import {
  createErrorEnvelope,
  createMockProduct,
  createMockStore,
  MockFetchServer,
  MockStorageManager,
} from './test-helpers';

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  getCategories,
  getProduct,
  getPublicStores,
  getStore,
  getStoreBySlug,
  getStoreProducts,
  searchProducts,
  storefront,
} from '../../src/lib/api/domains/storefront';
import { ApiError } from '../../src/lib/api/types';

describe('Storefront & Catalogue Domain API (F5)', () => {
  const fetchServer = new MockFetchServer();
  const storageManager = new MockStorageManager();

  beforeEach(() => {
    storageManager.setup();
    fetchServer.start();
  });

  afterEach(() => {
    fetchServer.stop();
    storageManager.teardown();
  });

  describe('1. getPublicStores() Store Directory Browsing', () => {
    it('retrieves public stores directory with default pagination', async () => {
      fetchServer.mock('/api/v1/stores/public', (req) => {
        assert.equal(req.method, 'GET');
        return {
          status: 200,
          body: {
            stores: [
              createMockStore({ id: 'store-1', name: 'Store One', slug: 'store-one' }),
              createMockStore({ id: 'store-2', name: 'Store Two', slug: 'store-two' }),
            ],
            total: 2,
            page: 1,
            size: 20,
          },
        };
      });

      const response = await getPublicStores();

      assert.equal(response.stores.length, 2);
      assert.equal(response.total, 2);
      assert.equal(response.page, 1);
      assert.equal(response.stores[0].slug, 'store-one');
      assert.equal(response.stores[1].slug, 'store-two');
    });

    it('filters public stores by city and custom pagination', async () => {
      fetchServer.mock('/api/v1/stores/public', (req) => {
        assert.ok(req.url.includes('city=Abuja'));
        assert.ok(req.url.includes('page=2'));
        assert.ok(req.url.includes('size=10'));

        return {
          status: 200,
          body: {
            stores: [
              createMockStore({ id: 'store-abuja-1', name: 'Abuja Market', city: 'Abuja' }),
            ],
            total: 1,
            page: 2,
            size: 10,
          },
        };
      });

      const response = await getPublicStores({
        city: 'Abuja',
        page: 2,
        size: 10,
      });

      assert.equal(response.stores.length, 1);
      assert.equal(response.stores[0].city, 'Abuja');
      assert.equal(response.page, 2);
    });

    it('handles empty stores directory gracefully', async () => {
      fetchServer.mock('/api/v1/stores/public', () => {
        return {
          status: 200,
          body: {
            stores: [],
            total: 0,
            page: 1,
            size: 20,
          },
        };
      });

      const response = await getPublicStores({ city: 'NonExistentCity' });
      assert.equal(response.stores.length, 0);
      assert.equal(response.total, 0);
    });
  });

  describe('2. getStore() & getStoreBySlug() Single Store Inspection', () => {
    it('retrieves store details by unique UUID identifier', async () => {
      fetchServer.mock('/api/v1/stores/store-uuid-101', (req) => {
        assert.ok(req.url.includes('/stores/store-uuid-101'));
        return {
          status: 200,
          body: createMockStore({ id: 'store-uuid-101', name: 'Fresh Mart Lekki' }),
        };
      });

      const store = await getStore('store-uuid-101');

      assert.equal(store.id, 'store-uuid-101');
      assert.equal(store.name, 'Fresh Mart Lekki');
      assert.equal(store.is_published, true);
    });

    it('throws 404 ApiError when store UUID does not exist', async () => {
      fetchServer.mock('/api/v1/stores/missing-id', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Store with ID "missing-id" not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getStore('missing-id');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          assert.equal(err.code, 'not_found');
          assert.ok(err.isNotFound);
          return true;
        }
      );
    });

    it('retrieves store details by SEO alphanumeric slug', async () => {
      fetchServer.mock('/api/v1/stores/slug/fresh-mart-lekki', (req) => {
        assert.ok(req.url.includes('/stores/slug/fresh-mart-lekki'));
        return {
          status: 200,
          body: createMockStore({ slug: 'fresh-mart-lekki', name: 'Fresh Mart Lekki' }),
        };
      });

      const store = await getStoreBySlug('fresh-mart-lekki');

      assert.equal(store.slug, 'fresh-mart-lekki');
      assert.equal(store.name, 'Fresh Mart Lekki');
    });

    it('throws 404 ApiError when store slug does not exist', async () => {
      fetchServer.mock('/api/v1/stores/slug/unknown-slug', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Store not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getStoreBySlug('unknown-slug');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          assert.ok(err.isNotFound);
          return true;
        }
      );
    });
  });

  describe('3. getCategories() Store Category Hierarchy', () => {
    it('retrieves list of product categories for a store', async () => {
      fetchServer.mock('/api/v1/catalogue/stores/store-uuid-101/categories', () => {
        return {
          status: 200,
          body: [
            { id: 'cat-1', store_id: 'store-uuid-101', name: 'Bakery & Pastries', slug: 'bakery' },
            { id: 'cat-2', store_id: 'store-uuid-101', name: 'Fresh Produce', slug: 'fresh-produce' },
          ],
        };
      });

      const categories = await getCategories('store-uuid-101');

      assert.equal(categories.length, 2);
      assert.equal(categories[0].name, 'Bakery & Pastries');
      assert.equal(categories[1].name, 'Fresh Produce');
    });

    it('throws ApiError when store catalogue categories request fails', async () => {
      fetchServer.mock('/api/v1/catalogue/stores/invalid-store/categories', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Store not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getCategories('invalid-store');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          return true;
        }
      );
    });
  });

  describe('4. getStoreProducts() Vendor Inventory Browsing', () => {
    it('retrieves paginated products for a store', async () => {
      fetchServer.mock('/api/v1/catalogue/stores/store-uuid-101/products', () => {
        return {
          status: 200,
          body: {
            products: [
              createMockProduct({ id: 'prod-1', name: 'Fresh Croissant', price: '1200.00' }),
              createMockProduct({ id: 'prod-2', name: 'Sourdough Bread', price: '2500.00' }),
            ],
            total: 2,
            page: 1,
            size: 20,
          },
        };
      });

      const response = await getStoreProducts('store-uuid-101');

      assert.equal(response.products.length, 2);
      assert.equal(response.total, 2);
      assert.equal(response.products[0].name, 'Fresh Croissant');
      assert.equal(response.products[1].price, '2500.00');
    });

    it('filters store products by category and keyword search', async () => {
      fetchServer.mock('/api/v1/catalogue/stores/store-uuid-101/products', (req) => {
        assert.ok(req.url.includes('category_id=cat-bakery-99'));
        assert.ok(req.url.includes('search=bread'));
        assert.ok(req.url.includes('page=1'));
        assert.ok(req.url.includes('size=10'));

        return {
          status: 200,
          body: {
            products: [createMockProduct({ name: 'Whole Wheat Bread', price: '1800.00' })],
            total: 1,
            page: 1,
            size: 10,
          },
        };
      });

      const response = await getStoreProducts('store-uuid-101', {
        category_id: 'cat-bakery-99',
        search: 'bread',
        page: 1,
        size: 10,
      });

      assert.equal(response.products.length, 1);
      assert.equal(response.products[0].name, 'Whole Wheat Bread');
    });
  });

  describe('5. searchProducts() Global Marketplace Search', () => {
    it('executes global search across all products with query parameter', async () => {
      fetchServer.mock('/api/v1/catalogue/products/search', (req) => {
        assert.ok(req.url.includes('query=organic'));
        assert.ok(req.url.includes('page=1'));
        assert.ok(req.url.includes('size=15'));

        return {
          status: 200,
          body: {
            products: [createMockProduct({ name: 'Organic Honey 500g' })],
            total: 1,
            page: 1,
            size: 15,
          },
        };
      });

      const results = await searchProducts({
        query: 'organic',
        page: 1,
        size: 15,
      });

      assert.equal(results.products.length, 1);
      assert.equal(results.products[0].name, 'Organic Honey 500g');
    });

    it('supports q shorthand parameter fallback in searchProducts', async () => {
      fetchServer.mock('/api/v1/catalogue/products/search', (req) => {
        assert.ok(req.url.includes('query=mango'));

        return {
          status: 200,
          body: {
            products: [createMockProduct({ name: 'Dried Mango Slices' })],
            total: 1,
            page: 1,
            size: 20,
          },
        };
      });

      const results = await searchProducts({
        q: 'mango',
      });

      assert.equal(results.products.length, 1);
      assert.equal(results.products[0].name, 'Dried Mango Slices');
    });
  });

  describe('6. getProduct() Product Inspection', () => {
    it('retrieves detailed product specifications by UUID', async () => {
      fetchServer.mock('/api/v1/catalogue/products/prod-uuid-201', () => {
        return {
          status: 200,
          body: createMockProduct({
            id: 'prod-uuid-201',
            name: 'Organic Honey 500g',
            price: '4500.00',
            sku: 'HONEY-500',
            inventory_count: 50,
          }),
        };
      });

      const product = await getProduct('prod-uuid-201');

      assert.equal(product.id, 'prod-uuid-201');
      assert.equal(product.name, 'Organic Honey 500g');
      assert.equal(product.price, '4500.00');
      assert.equal(product.inventory_count, 50);
    });

    it('throws 404 ApiError when product does not exist', async () => {
      fetchServer.mock('/api/v1/catalogue/products/missing-prod', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Product not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getProduct('missing-prod');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          assert.ok(err.isNotFound);
          return true;
        }
      );
    });
  });

  describe('7. Storefront Domain Barrel Export', () => {
    it('exports all domain functions on storefront namespace object', () => {
      assert.equal(typeof storefront.getPublicStores, 'function');
      assert.equal(typeof storefront.getStore, 'function');
      assert.equal(typeof storefront.getStoreBySlug, 'function');
      assert.equal(typeof storefront.getCategories, 'function');
      assert.equal(typeof storefront.getStoreProducts, 'function');
      assert.equal(typeof storefront.searchProducts, 'function');
      assert.equal(typeof storefront.getProduct, 'function');
    });
  });
});
