/**
 * SettleCart Real-Time & Live Tracking Domain SDK
 * 
 * Provides single-use ephemeral ticket acquisition, live WebSocket tracking
 * with 20s heartbeat keep-alive, and Server-Sent Events (SSE) subscriptions.
 */

import { client, getBaseUrl } from '../client';
import {
  ApiError,
  type RealtimeOrderEvent,
  type TicketResponse,
  type TrackingSummaryResponse,
} from '../types';

export interface WebSocketConnectionOptions {
  ticket?: string;
  onMessage: (event: RealtimeOrderEvent | Record<string, unknown> | unknown) => void;
  onError?: (err: Event | Error) => void;
  onClose?: (event?: CloseEvent) => void;
}

export interface WebSocketConnection {
  close: () => void;
  send: (data: unknown) => void;
}

export interface LiveTrackingSubscriptionOptions {
  ticket?: string;
  onEvent: (event: RealtimeOrderEvent | Record<string, unknown> | unknown) => void;
  onError?: (err: Event | Error) => void;
}

const EVENT_STREAM_TYPES = [
  'TRACKING_CONNECTED',
  'ORDER_STATUS_CHANGED',
  'VENDOR_ORDER_STATUS_CHANGED',
  'DISPATCH_TASK_UPDATED',
  'RIDER_LOCATION_UPDATED',
  'DELIVERY_COMPLETED',
];

/**
 * Issues a short-lived (30s) single-use connection ticket for WebSocket or SSE tracking.
 * Prevents exposing JWT credentials in query parameters.
 */
export async function getRealtimeTicket(): Promise<TicketResponse> {
  const { data } = await client.POST('/api/v1/realtime/ticket');

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to generate realtime connection ticket');
  }

  return data;
}

/**
 * Retrieves the static initial tracking summary snapshot for an order without opening a streaming connection.
 */
export async function getTrackingSummary(orderId: string): Promise<TrackingSummaryResponse> {
  const { data } = await client.GET('/api/v1/orders/{order_id}/tracking-summary', {
    params: {
      path: {
        order_id: orderId,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Tracking summary for order "${orderId}" not found`);
  }

  return data;
}

/**
 * Connects to the bi-directional WebSocket tracking endpoint (/api/v1/ws/orders/{orderId}).
 * Automatically acquires an ephemeral ticket if not explicitly provided.
 * Manages heartbeat ping every 20 seconds and handles incoming telemetry and status events.
 * 
 * Returns control handle: { close, send }.
 */
export function connectOrderWebSocket(
  orderId: string,
  options: WebSocketConnectionOptions
): WebSocketConnection {
  if (typeof window === 'undefined') {
    return {
      close: () => {},
      send: () => {},
    };
  }

  let ws: WebSocket | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let isClosed = false;

  const initSocket = (ticketString: string) => {
    if (isClosed) return;

    const base = getBaseUrl();
    const isHttps = typeof window !== 'undefined' ? window.location.protocol === 'https:' : base.startsWith('https');
    const wsProtocol = isHttps ? 'wss' : 'ws';
    const hostAndPath = base
      ? base.replace(/^https?:\/\//, '').replace(/\/+$/, '')
      : (typeof window !== 'undefined' ? window.location.host : 'localhost:8000');

    const wsUrl = hostAndPath.endsWith('/api/v1')
      ? `${wsProtocol}://${hostAndPath}/ws/orders/${orderId}?ticket=${encodeURIComponent(ticketString)}`
      : `${wsProtocol}://${hostAndPath}/api/v1/ws/orders/${orderId}?ticket=${encodeURIComponent(ticketString)}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Start 20s heartbeat keep-alive
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && typeof parsed === 'object' && parsed.type === 'pong') {
            return; // Heartbeat pong handled
          }
          options.onMessage(parsed);
        } catch {
          options.onMessage(event.data);
        }
      };

      ws.onerror = (err) => {
        options.onError?.(err);
      };

      ws.onclose = (closeEvent: CloseEvent) => {
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        options.onClose?.(closeEvent);
      };
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  if (options.ticket) {
    initSocket(options.ticket);
  } else {
    getRealtimeTicket()
      .then((res) => {
        initSocket(res.ticket);
      })
      .catch((err) => {
        options.onError?.(err);
      });
  }

  return {
    close: () => {
      isClosed = true;
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    send: (data: unknown) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    },
  };
}

/**
 * Subscribes to live Server-Sent Events (SSE) tracking stream for an order.
 * Automatically acquires an ephemeral ticket if not provided.
 * 
 * Returns unsubscribe function: () => void.
 */
export function subscribeOrderLiveTracking(
  orderId: string,
  options: LiveTrackingSubscriptionOptions
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let es: EventSource | null = null;
  let isUnsubscribed = false;

  const initEventSource = (ticketString: string) => {
    if (isUnsubscribed) return;

    const base = getBaseUrl();
    const normalizedBase = base.replace(/\/+$/, '');

    const sseUrl = normalizedBase.endsWith('/api/v1')
      ? `${normalizedBase}/orders/${orderId}/live-tracking?ticket=${encodeURIComponent(ticketString)}`
      : `${normalizedBase}/api/v1/orders/${orderId}/live-tracking?ticket=${encodeURIComponent(ticketString)}`;

    try {
      es = new EventSource(sseUrl);

      const parseAndDispatch = (dataStr: string) => {
        try {
          options.onEvent(JSON.parse(dataStr));
        } catch {
          options.onEvent(dataStr);
        }
      };

      es.onmessage = (event: MessageEvent) => {
        parseAndDispatch(event.data);
      };

      for (const eventName of EVENT_STREAM_TYPES) {
        es.addEventListener(eventName, (event: MessageEvent) => {
          parseAndDispatch(event.data);
        });
      }

      es.onerror = (err) => {
        options.onError?.(err);
      };
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  if (options.ticket) {
    initEventSource(options.ticket);
  } else {
    getRealtimeTicket()
      .then((res) => {
        initEventSource(res.ticket);
      })
      .catch((err) => {
        options.onError?.(err);
      });
  }

  return () => {
    isUnsubscribed = true;
    if (es) {
      es.close();
      es = null;
    }
  };
}

export const realtime = {
  getRealtimeTicket,
  getTrackingSummary,
  connectOrderWebSocket,
  subscribeOrderLiveTracking,
};

export default realtime;
