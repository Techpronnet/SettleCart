/**
 * Tier 1 & Tier 2 Tests: Real-Time & Live Tracking Domain SDK (F8)
 * 
 * Verifies single-use ephemeral ticket acquisition, order tracking summary,
 * bi-directional WebSocket live tracking with 20s heartbeat keep-alive,
 * and Server-Sent Events (SSE) subscriptions for order tracking updates.
 */

import {
  createErrorEnvelope,
  createMockTicket,
  createMockTrackingSummary,
  MockEventSource,
  MockFetchServer,
  MockStorageManager,
  MockWebSocket,
} from './test-helpers';

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  connectOrderWebSocket,
  getRealtimeTicket,
  getTrackingSummary,
  realtime,
  subscribeOrderLiveTracking,
} from '../../src/lib/api/domains/realtime';
import { ApiError } from '../../src/lib/api/types';

describe('Real-Time & Live Tracking Domain SDK (F8)', () => {
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

  describe('1. getRealtimeTicket() & getTrackingSummary() Ephemeral Credentials', () => {
    it('acquires 30-second single-use ticket for streaming authentication', async () => {
      fetchServer.mock('/api/v1/realtime/ticket', (req) => {
        assert.equal(req.method, 'POST');
        return {
          status: 200,
          body: createMockTicket('eph-ticket-abc-789'),
        };
      }, { method: 'POST' });

      const ticketResponse = await getRealtimeTicket();

      assert.equal(ticketResponse.ticket, 'eph-ticket-abc-789');
      assert.equal(ticketResponse.expires_in_seconds, 30);
      assert.equal(ticketResponse.token_type, 'ticket');
    });

    it('throws ApiError when ticket generation fails', async () => {
      fetchServer.mock('/api/v1/realtime/ticket', () => {
        return {
          status: 401,
          body: createErrorEnvelope('unauthorized', 'Session expired'),
        };
      }, { method: 'POST' });

      await assert.rejects(
        async () => {
          await getRealtimeTicket();
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          assert.ok(err.isUnauthorized);
          return true;
        }
      );
    });

    it('retrieves static order tracking summary snapshot', async () => {
      fetchServer.mock('/api/v1/orders/order-uuid-999/tracking-summary', () => {
        return {
          status: 200,
          body: createMockTrackingSummary({
            order_id: 'order-uuid-999',
            status: 'out_for_delivery',
          }),
        };
      });

      const summary = await getTrackingSummary('order-uuid-999');

      assert.equal(summary.order_id, 'order-uuid-999');
      assert.equal(summary.status, 'out_for_delivery');
      assert.ok(summary.latest_rider_location);
    });

    it('throws 404 ApiError when tracking summary is not found', async () => {
      fetchServer.mock('/api/v1/orders/missing-order/tracking-summary', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Order tracking summary not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getTrackingSummary('missing-order');
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

  describe('2. connectOrderWebSocket() Bi-Directional Streaming', () => {
    it('connects to WebSocket endpoint with explicit ticket parameter', async () => {
      const messages: unknown[] = [];

      const connection = connectOrderWebSocket('order-uuid-999', {
        ticket: 'explicit-ws-ticket',
        onMessage: (msg) => messages.push(msg),
      });

      assert.equal(MockWebSocket.instances.length, 1);
      const ws = MockWebSocket.instances[0];

      assert.ok(ws.url.includes('/ws/orders/order-uuid-999'));
      assert.ok(ws.url.includes('ticket=explicit-ws-ticket'));

      // Simulate incoming telemetry message
      ws.simulateMessage({
        event_type: 'RIDER_LOCATION_UPDATED',
        order_id: 'order-uuid-999',
        timestamp: '2026-09-25T11:00:00Z',
        data: {
          task_id: 'task-uuid-501',
          latitude: 6.4281,
          longitude: 3.4219,
          updated_at: '2026-09-25T11:00:00Z',
        },
      });

      assert.equal(messages.length, 1);
      const event = messages[0] as Record<string, unknown>;
      assert.equal(event['event_type'], 'RIDER_LOCATION_UPDATED');

      // Test send()
      ws.readyState = MockWebSocket.OPEN;
      connection.send({ action: 'ping_custom' });
      assert.equal(ws.sentMessages.length, 1);
      assert.equal(ws.sentMessages[0], JSON.stringify({ action: 'ping_custom' }));

      // Test close()
      connection.close();
      assert.equal(ws.readyState, MockWebSocket.CLOSED);
    });

    it('automatically acquires ephemeral ticket if not explicitly provided', async () => {
      fetchServer.mock('/api/v1/realtime/ticket', () => {
        return {
          status: 200,
          body: createMockTicket('auto-acquired-ticket-123'),
        };
      }, { method: 'POST' });

      let receivedEvent: unknown = null;

      const connection = connectOrderWebSocket('order-uuid-999', {
        onMessage: (msg) => {
          receivedEvent = msg;
        },
      });

      // Allow ticket acquisition promise to settle
      await new Promise((resolve) => setTimeout(resolve, 20));

      assert.equal(MockWebSocket.instances.length, 1);
      const ws = MockWebSocket.instances[0];
      assert.ok(ws.url.includes('ticket=auto-acquired-ticket-123'));

      ws.simulateMessage({ event_type: 'ORDER_STATUS_CHANGED', data: { status: 'delivered' } });
      assert.ok(receivedEvent);

      connection.close();
    });

    it('ignores heartbeat pong messages without forwarding to onMessage handler', async () => {
      const messages: unknown[] = [];

      const connection = connectOrderWebSocket('order-uuid-999', {
        ticket: 'ticket-heartbeat-test',
        onMessage: (msg) => messages.push(msg),
      });

      const ws = MockWebSocket.instances[0];

      // Simulate heartbeat pong response from server
      ws.simulateMessage({ type: 'pong' });

      // Pong must be filtered and not passed to application onMessage
      assert.equal(messages.length, 0);

      // Other messages must pass through
      ws.simulateMessage({ type: 'status_update', status: 'ready' });
      assert.equal(messages.length, 1);

      connection.close();
    });

    it('triggers onError and onClose callbacks appropriately', async () => {
      let errorTriggered = false;
      let closeTriggered = false;

      const connection = connectOrderWebSocket('order-uuid-999', {
        ticket: 'ticket-err-test',
        onMessage: () => {},
        onError: () => {
          errorTriggered = true;
        },
        onClose: () => {
          closeTriggered = true;
        },
      });

      const ws = MockWebSocket.instances[0];
      ws.simulateError(new Error('Connection dropped'));
      assert.equal(errorTriggered, true);

      ws.close(1006, 'Abnormal closure');
      assert.equal(closeTriggered, true);

      connection.close();
    });

    it('handles SSR gracefully when window is undefined', () => {
      storageManager.teardown(); // window is undefined

      const connection = connectOrderWebSocket('order-uuid-999', {
        onMessage: () => {},
      });

      assert.doesNotThrow(() => {
        connection.send({ test: true });
        connection.close();
      });
    });
  });

  describe('3. subscribeOrderLiveTracking() Server-Sent Events (SSE)', () => {
    it('subscribes to live SSE stream and receives typed events', async () => {
      const events: unknown[] = [];

      const unsubscribe = subscribeOrderLiveTracking('order-uuid-999', {
        ticket: 'sse-ticket-abc',
        onEvent: (event) => events.push(event),
      });

      assert.equal(MockEventSource.instances.length, 1);
      const es = MockEventSource.instances[0];

      assert.ok(es.url.includes('/orders/order-uuid-999/live-tracking'));
      assert.ok(es.url.includes('ticket=sse-ticket-abc'));

      // Simulate TRACKING_CONNECTED event
      es.simulateEvent('TRACKING_CONNECTED', {
        event_type: 'TRACKING_CONNECTED',
        order_id: 'order-uuid-999',
        timestamp: '2026-09-25T11:00:00Z',
        data: createMockTrackingSummary(),
      });

      assert.equal(events.length, 1);
      const ev1 = events[0] as Record<string, unknown>;
      assert.equal(ev1['event_type'], 'TRACKING_CONNECTED');

      // Simulate RIDER_LOCATION_UPDATED event
      es.simulateEvent('RIDER_LOCATION_UPDATED', {
        event_type: 'RIDER_LOCATION_UPDATED',
        order_id: 'order-uuid-999',
        data: { task_id: 'task-1', latitude: 6.428, longitude: 3.421 },
      });

      assert.equal(events.length, 2);

      // Simulate DELIVERY_COMPLETED event
      es.simulateEvent('DELIVERY_COMPLETED', {
        event_type: 'DELIVERY_COMPLETED',
        order_id: 'order-uuid-999',
        data: { task_id: 'task-1', delivered_at: '2026-09-25T11:45:00Z' },
      });

      assert.equal(events.length, 3);

      // Unsubscribe terminates EventSource
      unsubscribe();
      assert.equal(es.readyState, MockEventSource.CLOSED);
    });

    it('automatically acquires ticket before establishing SSE stream', async () => {
      fetchServer.mock('/api/v1/realtime/ticket', () => {
        return {
          status: 200,
          body: createMockTicket('auto-sse-ticket-xyz'),
        };
      }, { method: 'POST' });

      let received: unknown = null;

      const unsubscribe = subscribeOrderLiveTracking('order-uuid-999', {
        onEvent: (ev) => {
          received = ev;
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      assert.equal(MockEventSource.instances.length, 1);
      const es = MockEventSource.instances[0];
      assert.ok(es.url.includes('ticket=auto-sse-ticket-xyz'));

      es.simulateEvent('ORDER_STATUS_CHANGED', {
        event_type: 'ORDER_STATUS_CHANGED',
        data: { order_id: 'order-uuid-999', status: 'picked_up' },
      });

      assert.ok(received);
      unsubscribe();
    });

    it('invokes onError handler when SSE encounters connection error', async () => {
      let errorFired = false;

      const unsubscribe = subscribeOrderLiveTracking('order-uuid-999', {
        ticket: 'ticket-err',
        onEvent: () => {},
        onError: () => {
          errorFired = true;
        },
      });

      const es = MockEventSource.instances[0];
      es.simulateError(new Error('SSE Stream Interrupted'));

      assert.equal(errorFired, true);
      unsubscribe();
    });

    it('handles SSR gracefully when EventSource or window is undefined', () => {
      storageManager.teardown();

      const unsubscribe = subscribeOrderLiveTracking('order-uuid-999', {
        onEvent: () => {},
      });

      assert.doesNotThrow(() => {
        unsubscribe();
      });
    });
  });

  describe('4. Realtime Domain Barrel Export', () => {
    it('exports all domain functions on realtime namespace object', () => {
      assert.equal(typeof realtime.getRealtimeTicket, 'function');
      assert.equal(typeof realtime.getTrackingSummary, 'function');
      assert.equal(typeof realtime.connectOrderWebSocket, 'function');
      assert.equal(typeof realtime.subscribeOrderLiveTracking, 'function');
    });
  });
});
