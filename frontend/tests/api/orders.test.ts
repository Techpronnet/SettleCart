/**
 * Tier 1 & Tier 2 Tests: Orders & Payments Domain API (F6)
 * 
 * Verifies multi-vendor order placement, order status queries, Paystack payment
 * initialization, payment verification, and domain error handling.
 */

import {
  createErrorEnvelope,
  createMockOrder,
  MockFetchServer,
  MockStorageManager,
} from './test-helpers';

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  createOrder,
  getOrder,
  initializePayment,
  orders,
  verifyPayment,
} from '../../src/lib/api/domains/orders';
import { ApiError } from '../../src/lib/api/types';

describe('Orders & Payments Domain API (F6)', () => {
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

  describe('1. createOrder() Multi-Vendor Order Placement', () => {
    it('creates multi-vendor order from cart items payload', async () => {
      fetchServer.mock('/api/v1/orders/', (req) => {
        assert.equal(req.method, 'POST');
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['delivery_city'], 'Lagos');
        assert.equal(bodyObj['delivery_phone'], '+2348000000001');

        return {
          status: 200,
          body: createMockOrder({
            id: 'ord-created-101',
            order_number: 'ORD-2026-0925-01',
            status: 'created',
            total: '10700.00',
          }),
        };
      }, { method: 'POST' });

      const order = await createOrder({
        items: [
          { product_id: 'prod-uuid-201', quantity: 2 },
          { product_id: 'prod-uuid-202', quantity: 1 },
        ],
        delivery_address: '12 Victoria Island',
        delivery_city: 'Lagos',
        delivery_phone: '+2348000000001',
        notes: 'Leave at front gate with security',
      });

      assert.equal(order.id, 'ord-created-101');
      assert.equal(order.order_number, 'ORD-2026-0925-01');
      assert.equal(order.status, 'created');
      assert.equal(order.total, '10700.00');
      assert.equal(order.vendor_orders.length, 1);
    });

    it('throws 422 ApiError when cart items list is empty', async () => {
      fetchServer.mock('/api/v1/orders/', () => {
        return {
          status: 422,
          body: createErrorEnvelope('validation_error', 'Order must contain at least one item', [
            { field: 'items', message: 'Must not be empty' },
          ]),
        };
      }, { method: 'POST' });

      await assert.rejects(
        async () => {
          await createOrder({
            items: [],
            delivery_address: '12 Victoria Island',
            delivery_city: 'Lagos',
            delivery_phone: '+2348000000001',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 422);
          assert.equal(err.code, 'validation_error');
          assert.ok(err.isValidationError);
          return true;
        }
      );
    });
  });

  describe('2. getOrder() Order Status Inspection', () => {
    it('retrieves detailed order breakdown by UUID', async () => {
      fetchServer.mock('/api/v1/orders/order-uuid-999', (req) => {
        assert.ok(req.url.includes('/orders/order-uuid-999'));
        return {
          status: 200,
          body: createMockOrder({
            id: 'order-uuid-999',
            status: 'processing',
          }),
        };
      });

      const order = await getOrder('order-uuid-999');

      assert.equal(order.id, 'order-uuid-999');
      assert.equal(order.status, 'processing');
      assert.equal(order.vendor_orders[0].items.length, 1);
    });

    it('throws 404 ApiError when order ID does not exist', async () => {
      fetchServer.mock('/api/v1/orders/non-existent-order', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Order with ID "non-existent-order" not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getOrder('non-existent-order');
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

  describe('3. initializePayment() Paystack Gateway Handoff', () => {
    it('initializes checkout transaction and returns gateway redirect URL and reference', async () => {
      fetchServer.mock('/api/v1/payments/initialize', (req) => {
        assert.equal(req.method, 'POST');
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['order_id'], 'order-uuid-999');

        return {
          status: 200,
          body: {
            transaction_id: 'txn-uuid-888',
            reference: 'PSTK-REF-20260925-001',
            authorization_url: 'https://checkout.paystack.com/pay-xyz123',
            access_code: 'access-code-123',
            amount: '10700.00',
            currency: 'NGN',
          },
        };
      }, { method: 'POST' });

      const response = await initializePayment({
        order_id: 'order-uuid-999',
      });

      assert.equal(response.transaction_id, 'txn-uuid-888');
      assert.equal(response.reference, 'PSTK-REF-20260925-001');
      assert.equal(response.authorization_url, 'https://checkout.paystack.com/pay-xyz123');
      assert.equal(response.amount, '10700.00');
    });

    it('throws 400 ApiError if order is already paid or cancelled', async () => {
      fetchServer.mock('/api/v1/payments/initialize', () => {
        return {
          status: 400,
          body: createErrorEnvelope('order_already_paid', 'This order has already been paid for'),
        };
      }, { method: 'POST' });

      await assert.rejects(
        async () => {
          await initializePayment({
            order_id: 'already-paid-order-id',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 400);
          assert.equal(err.code, 'order_already_paid');
          return true;
        }
      );
    });
  });

  describe('4. verifyPayment() Paystack Confirmation & Settlement Trigger', () => {
    it('verifies payment reference and returns successful transaction', async () => {
      fetchServer.mock('/api/v1/payments/verify/PSTK-REF-20260925-001', (req) => {
        assert.ok(req.url.includes('/payments/verify/PSTK-REF-20260925-001'));
        return {
          status: 200,
          body: {
            id: 'txn-uuid-888',
            order_id: 'order-uuid-999',
            reference: 'PSTK-REF-20260925-001',
            amount: '10700.00',
            currency: 'NGN',
            status: 'successful',
            provider: 'paystack',
            provider_reference: 'paystack-gw-ref-999',
            channel: 'card',
            paid_at: '2026-09-25T10:35:00Z',
            created_at: '2026-09-25T10:30:00Z',
          },
        };
      });

      const transaction = await verifyPayment('PSTK-REF-20260925-001');

      assert.equal(transaction.reference, 'PSTK-REF-20260925-001');
      assert.equal(transaction.status, 'successful');
      assert.equal(transaction.amount, '10700.00');
      assert.equal(transaction.channel, 'card');
    });

    it('handles payment verification when transaction status is failed', async () => {
      fetchServer.mock('/api/v1/payments/verify/PSTK-FAILED-REF', () => {
        return {
          status: 200,
          body: {
            id: 'txn-uuid-failed',
            order_id: 'order-uuid-999',
            reference: 'PSTK-FAILED-REF',
            amount: '10700.00',
            currency: 'NGN',
            status: 'failed',
            provider: 'paystack',
            channel: 'card',
            created_at: '2026-09-25T10:30:00Z',
          },
        };
      });

      const transaction = await verifyPayment('PSTK-FAILED-REF');

      assert.equal(transaction.reference, 'PSTK-FAILED-REF');
      assert.equal(transaction.status, 'failed');
    });

    it('throws 404 ApiError when payment reference is unknown', async () => {
      fetchServer.mock('/api/v1/payments/verify/INVALID-REF', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Payment transaction reference not found'),
        };
      });

      await assert.rejects(
        async () => {
          await verifyPayment('INVALID-REF');
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

  describe('5. Orders Domain Barrel Export', () => {
    it('exports all domain functions on orders namespace object', () => {
      assert.equal(typeof orders.createOrder, 'function');
      assert.equal(typeof orders.getOrder, 'function');
      assert.equal(typeof orders.initializePayment, 'function');
      assert.equal(typeof orders.verifyPayment, 'function');
    });
  });
});
