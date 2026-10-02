/**
 * SettleCart Orders & Payments Domain API Module
 * 
 * Provides typed operations for multi-vendor order placement, order status tracking,
 * Paystack payment gateway initialization, and payment transaction verification.
 */

import { client } from '../client';
import {
  ApiError,
  type CreateOrderRequest,
  type InitializePaymentRequest,
  type InitializePaymentResponse,
  type OrderListResponse,
  type OrderResponse,
  type PaymentTransactionResponse,
  type DisputeOrderRequest,
} from '../types';

/**
 * Creates a multi-vendor order from customer cart items.
 * Backend automatically partitions items into child vendor orders.
 */
export async function createOrder(payload: CreateOrderRequest): Promise<OrderResponse> {
  const { data } = await client.POST('/api/v1/orders/', {
    body: payload,
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Order creation returned empty response');
  }

  return data;
}

/**
 * Retrieves full order details by order UUID, including vendor orders, items, and shipping status.
 */
export async function getOrder(orderId: string): Promise<OrderResponse> {
  const { data } = await client.GET('/api/v1/orders/{order_id}', {
    params: {
      path: {
        order_id: orderId,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Order with ID "${orderId}" not found`);
  }

  return data;
}

/**
 * Initializes a Paystack checkout transaction for an order.
 * Returns checkout URL and reference to redirect the customer to payment.
 */
export async function initializePayment(
  payload: InitializePaymentRequest
): Promise<InitializePaymentResponse> {
  const { data } = await client.POST('/api/v1/payments/initialize', {
    body: payload,
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Payment initialization returned empty response');
  }

  return data;
}

/**
 * Verifies transaction payment reference against Paystack gateway.
 * Confirms payment and updates order status to payment_confirmed upon success.
 */
export async function verifyPayment(reference: string): Promise<PaymentTransactionResponse> {
  const { data } = await client.GET('/api/v1/payments/verify/{reference}', {
    params: {
      path: {
        reference,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Payment reference "${reference}" not found or verification failed`);
  }

  return data;
}

/**
 * Retrieves the paginated order history of the currently authenticated customer.
 */
export async function listMyOrders(page = 1, size = 20): Promise<OrderListResponse> {
  const { data } = await client.GET('/api/v1/orders/', {
    params: {
      query: {
        page,
        size,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to retrieve orders');
  }

  return data;
}

/**
  * Submits an official customer dispute for an order.
  * Transitions order to DISPUTED status on backend and broadcasts update.
  */
export async function disputeOrder(
  orderId: string,
  reason: string,
  details: string
): Promise<OrderResponse> {
  const body: DisputeOrderRequest = { reason, details };
  const { data } = await (client.POST as any)('/api/v1/orders/{order_id}/dispute', {
    params: {
      path: {
        order_id: orderId,
      },
    },
    body,
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to lodge dispute');
  }

  return data as OrderResponse;
}

export const orders = {
  createOrder,
  getOrder,
  listMyOrders,
  initializePayment,
  verifyPayment,
  disputeOrder,
};

export default orders;
