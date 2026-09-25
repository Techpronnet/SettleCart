/**
 * SettleCart API Test Harness & Mock Utilities
 * 
 * Provides deterministic in-memory mocking for fetch, browser storage (cookie/localStorage),
 * WebSocket, and EventSource (SSE) streaming connections.
 */

import type {
  DeliveryTaskResponse,
  OrderResponse,
  ProductResponse,
  StoreResponse,
  TicketResponse,
  TrackingSummaryResponse,
  UserResponse,
} from '../../src/lib/api/types';

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody?: ArrayBuffer;
}

export type MockHandler = (
  req: RecordedRequest
) => Promise<{ status?: number; body?: unknown; headers?: Record<string, string> } | Response> |
     { status?: number; body?: unknown; headers?: Record<string, string> } | Response;

interface MockRoute {
  method?: string;
  urlMatcher: string | RegExp | ((url: string) => boolean);
  handler: MockHandler;
  remainingCalls?: number; // Optional call limit for sequential mocking
}

const originalNativeFetch = globalThis.fetch;
let activeFetchDispatcher: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | null = null;

// Persistent delegator hooked at module load time so openapi-fetch captures it
globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (activeFetchDispatcher) {
    return activeFetchDispatcher(input, init);
  }
  return originalNativeFetch(input, init);
};

export class MockFetchServer {
  private routes: MockRoute[] = [];
  private recordedRequests: RecordedRequest[] = [];

  public start(): void {
    this.recordedRequests = [];
    this.routes = [];

    activeFetchDispatcher = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url: string;
      let method = 'GET';
      const headersRecord: Record<string, string> = {};
      let body: unknown = undefined;
      let rawBody: ArrayBuffer | undefined = undefined;

      if (input instanceof Request) {
        url = input.url;
        method = input.method;
        input.headers.forEach((val, key) => {
          headersRecord[key.toLowerCase()] = val;
        });

        if (input.body) {
          try {
            const clone = input.clone();
            rawBody = await clone.arrayBuffer();
            const text = new TextDecoder().decode(rawBody);
            try {
              body = JSON.parse(text);
            } catch {
              body = text;
            }
          } catch {
            // body extraction fallback
          }
        }
      } else {
        url = String(input);
        if (init?.method) method = init.method.toUpperCase();
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((val, key) => {
              headersRecord[key.toLowerCase()] = val;
            });
          } else if (Array.isArray(init.headers)) {
            for (const [k, v] of init.headers) {
              headersRecord[k.toLowerCase()] = v;
            }
          } else {
            for (const [k, v] of Object.entries(init.headers)) {
              headersRecord[k.toLowerCase()] = String(v);
            }
          }
        }

        if (init?.body) {
          if (typeof init.body === 'string') {
            try {
              body = JSON.parse(init.body);
            } catch {
              body = init.body;
            }
            rawBody = new TextEncoder().encode(init.body).buffer;
          } else if (init.body instanceof ArrayBuffer) {
            rawBody = init.body;
            try {
              const text = new TextDecoder().decode(init.body);
              body = JSON.parse(text);
            } catch {
              body = init.body;
            }
          } else {
            body = init.body;
          }
        }
      }

      const recorded: RecordedRequest = {
        url,
        method,
        headers: headersRecord,
        body,
        rawBody,
      };
      this.recordedRequests.push(recorded);

      // Match route
      for (let i = 0; i < this.routes.length; i++) {
        const route = this.routes[i];
        if (route.method && route.method !== method) continue;

        let matches = false;
        if (typeof route.urlMatcher === 'string') {
          matches = url.includes(route.urlMatcher);
        } else if (route.urlMatcher instanceof RegExp) {
          matches = route.urlMatcher.test(url);
        } else if (typeof route.urlMatcher === 'function') {
          matches = route.urlMatcher(url);
        }

        if (matches) {
          if (route.remainingCalls !== undefined) {
            route.remainingCalls--;
            if (route.remainingCalls <= 0) {
              this.routes.splice(i, 1);
            }
          }

          const result = await route.handler(recorded);
          if (result instanceof Response) {
            return result;
          }

          const status = result.status ?? 200;
          const resHeaders = new Headers(result.headers || { 'Content-Type': 'application/json' });
          const resBody = typeof result.body === 'string'
            ? result.body
            : JSON.stringify(result.body ?? {});

          return new Response(resBody, {
            status,
            statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : 'Error',
            headers: resHeaders,
          });
        }
      }

      // Default 404 unhandled mock response
      return new Response(
        JSON.stringify({
          error: {
            code: 'unhandled_mock_route',
            message: `No mock route matched [${method}] ${url}`,
          },
        }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };
  }

  public stop(): void {
    activeFetchDispatcher = null;
    this.recordedRequests = [];
    this.routes = [];
  }

  public mock(
    urlMatcher: string | RegExp | ((url: string) => boolean),
    handler: MockHandler,
    options?: { method?: string; remainingCalls?: number }
  ): this {
    this.routes.unshift({
      urlMatcher,
      handler,
      method: options?.method?.toUpperCase(),
      remainingCalls: options?.remainingCalls,
    });
    return this;
  }

  public getRequests(): RecordedRequest[] {
    return [...this.recordedRequests];
  }

  public clearRequests(): void {
    this.recordedRequests = [];
  }
}

// In-memory DOM storage mock
export class MockStorageManager {
  private cookies: Map<string, string> = new Map();
  private localStorageStore: Map<string, string> = new Map();
  private originalWindow: unknown;
  private originalDocument: unknown;
  private activeIntervals = new Set<number | NodeJS.Timeout | ReturnType<typeof setInterval>>();
  private originalSetInterval = globalThis.setInterval;
  private originalClearInterval = globalThis.clearInterval;

  public setup(isHttps = false): void {
    this.originalWindow = (globalThis as unknown as { window?: unknown }).window;
    this.originalDocument = (globalThis as unknown as { document?: unknown }).document;
    this.cookies.clear();
    this.localStorageStore.clear();

    const activeIntervals = this.activeIntervals;
    const origSetInterval = this.originalSetInterval;
    const origClearInterval = this.originalClearInterval;

    globalThis.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const timer = origSetInterval(handler as () => void, timeout, ...args);
      activeIntervals.add(timer);
      return timer;
    }) as typeof setInterval;

    globalThis.clearInterval = ((timer?: ReturnType<typeof setInterval>) => {
      if (timer) {
        activeIntervals.delete(timer);
        origClearInterval(timer);
      }
    }) as typeof clearInterval;

    const cookies = this.cookies;
    const localStorageStore = this.localStorageStore;

    const mockDocument = {
      get cookie(): string {
        const parts: string[] = [];
        cookies.forEach((value, key) => {
          parts.push(`${key}=${encodeURIComponent(value)}`);
        });
        return parts.join('; ');
      },
      set cookie(cookieStr: string) {
        const [cookiePair] = cookieStr.split(';');
        const eqIdx = cookiePair.indexOf('=');
        if (eqIdx !== -1) {
          const key = cookiePair.substring(0, eqIdx).trim();
          const val = decodeURIComponent(cookiePair.substring(eqIdx + 1).trim());

          // Check if expired
          if (cookieStr.includes('Max-Age=0') || cookieStr.includes('Expires=Thu, 01 Jan 1970')) {
            cookies.delete(key);
          } else {
            cookies.set(key, val);
          }
        }
      },
    };

    const mockLocalStorage = {
      getItem(key: string): string | null {
        return localStorageStore.get(key) ?? null;
      },
      setItem(key: string, val: string): void {
        localStorageStore.set(key, String(val));
      },
      removeItem(key: string): void {
        localStorageStore.delete(key);
      },
      clear(): void {
        localStorageStore.clear();
      },
    };

    const mockWindow = {
      location: {
        protocol: isHttps ? 'https:' : 'http:',
        host: 'localhost:3000',
      },
      localStorage: mockLocalStorage,
      WebSocket: MockWebSocket as unknown as typeof WebSocket,
      EventSource: MockEventSource as unknown as typeof EventSource,
    };

    (globalThis as unknown as { window: unknown }).window = mockWindow;
    (globalThis as unknown as { document: unknown }).document = mockDocument;
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
    (globalThis as unknown as { EventSource: unknown }).EventSource = MockEventSource;
  }

  public teardown(): void {
    for (const ws of MockWebSocket.instances) {
      ws.close();
    }
    for (const es of MockEventSource.instances) {
      es.close();
    }
    for (const timer of this.activeIntervals) {
      this.originalClearInterval(timer);
    }
    this.activeIntervals.clear();
    globalThis.setInterval = this.originalSetInterval;
    globalThis.clearInterval = this.originalClearInterval;

    (globalThis as unknown as { window: unknown }).window = this.originalWindow;
    (globalThis as unknown as { document: unknown }).document = this.originalDocument;
    delete (globalThis as unknown as { WebSocket?: unknown }).WebSocket;
    delete (globalThis as unknown as { EventSource?: unknown }).EventSource;
    this.cookies.clear();
    this.localStorageStore.clear();
    MockWebSocket.clearInstances();
    MockEventSource.clearInstances();
  }

  public getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  public setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  public getLocalStorageItem(name: string): string | null {
    return this.localStorageStore.get(name) ?? null;
  }

  public setLocalStorageItem(name: string, value: string): void {
    this.localStorageStore.set(name, value);
  }
}

// Mock WebSocket class
export class MockWebSocket {
  public static instances: MockWebSocket[] = [];
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public readonly url: string;
  public readonly protocols?: string | string[];
  public readyState: number = MockWebSocket.CONNECTING;

  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;

  public sentMessages: unknown[] = [];
  public isClosed = false;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);

    // Automatically trigger open on next microtask
    queueMicrotask(() => {
      if (!this.isClosed) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.(new Event('open'));
      }
    });
  }

  public send(data: unknown): void {
    this.sentMessages.push(data);
  }

  public close(code = 1000, reason = 'Normal Closure'): void {
    this.readyState = MockWebSocket.CLOSED;
    this.isClosed = true;
    const closeEvent = { code, reason, wasClean: true } as CloseEvent;
    this.onclose?.(closeEvent);
  }

  public simulateMessage(data: unknown): void {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const event = { data: payload } as MessageEvent;
    this.onmessage?.(event);
  }

  public simulateError(err?: Error | Event): void {
    this.onerror?.((err as Event) || new Event('error'));
  }

  public static clearInstances(): void {
    MockWebSocket.instances = [];
  }
}

// Mock EventSource class
export class MockEventSource {
  public static instances: MockEventSource[] = [];
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSED = 2;

  public readonly url: string;
  public readyState: number = MockEventSource.CONNECTING;

  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  private listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();
  public isClosed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);

    queueMicrotask(() => {
      if (!this.isClosed) {
        this.readyState = MockEventSource.OPEN;
        this.onopen?.(new Event('open'));
      }
    });
  }

  public addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const list = this.listeners.get(type) || [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  public removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter((l) => l !== listener));
  }

  public close(): void {
    this.readyState = MockEventSource.CLOSED;
    this.isClosed = true;
  }

  public simulateEvent(type: string, data: unknown): void {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const event = { data: payload, type } as MessageEvent;

    if (type === 'message') {
      this.onmessage?.(event);
    }

    const listeners = this.listeners.get(type) || [];
    for (const listener of listeners) {
      listener(event);
    }
  }

  public simulateError(err?: Error | Event): void {
    this.onerror?.((err as Event) || new Event('error'));
  }

  public static clearInstances(): void {
    MockEventSource.instances = [];
  }
}

// Fixture Factories
export function createMockTokens(access = 'mock-access-token-123', refresh = 'mock-refresh-token-456') {
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: 'bearer',
  };
}

export function createMockUser(overrides?: Partial<UserResponse>): UserResponse {
  return {
    id: 'user-uuid-1',
    email: 'user@example.com',
    full_name: 'Test Customer',
    role: 'customer',
    is_active: true,
    is_verified: true,
    phone: '+2348000000001',
    created_at: '2026-09-25T10:00:00Z',
    ...overrides,
  };
}

export function createMockStore(overrides?: Partial<StoreResponse>): StoreResponse {
  return {
    id: 'store-uuid-101',
    business_id: 'biz-uuid-1',
    name: 'Fresh Mart Lekki',
    slug: 'fresh-mart-lekki',
    description: 'Premier grocery and provisions vendor',
    address: '15 Admiralty Way',
    city: 'Lagos',
    state: 'Lagos',
    phone: '+2348000000003',
    email: 'contact@freshmart.ng',
    logo_url: 'https://images.settlecart.com/stores/fresh-mart.png',
    is_active: true,
    is_published: true,
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z',
    ...overrides,
  };
}

export function createMockProduct(overrides?: Partial<ProductResponse>): ProductResponse {
  return {
    id: 'prod-uuid-201',
    store_id: 'store-uuid-101',
    category_id: 'cat-uuid-301',
    name: 'Organic Honey 500g',
    slug: 'organic-honey-500g',
    description: 'Pure raw wildflower honey',
    price: '4500.00',
    compare_at_price: '5000.00',
    sku: 'HONEY-500',
    track_inventory: true,
    inventory_count: 25,
    images: ['https://images.settlecart.com/products/honey.png'],
    is_active: true,
    is_published: true,
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
    ...overrides,
  };
}

export function createMockOrder(overrides?: Partial<OrderResponse>): OrderResponse {
  return {
    id: 'order-uuid-999',
    order_number: 'ORD-2026-0001',
    customer_id: 'user-uuid-1',
    status: 'created',
    subtotal: '9000.00',
    delivery_fee: '1500.00',
    platform_fee: '200.00',
    total: '10700.00',
    delivery_address: '12 Victoria Island',
    delivery_city: 'Lagos',
    delivery_phone: '+2348000000001',
    created_at: '2026-09-25T10:30:00Z',
    updated_at: '2026-09-25T10:30:00Z',
    vendor_orders: [
      {
        id: 'vendor-order-1',
        order_id: 'order-uuid-999',
        store_id: 'store-uuid-101',
        status: 'pending',
        subtotal: '9000.00',
        created_at: '2026-09-25T10:30:00Z',
        updated_at: '2026-09-25T10:30:00Z',
        items: [
          {
            id: 'item-uuid-1',
            vendor_order_id: 'vendor-order-1',
            product_id: 'prod-uuid-201',
            product_name: 'Organic Honey 500g',
            product_price: '4500.00',
            quantity: 2,
            subtotal: '9000.00',
            created_at: '2026-09-25T10:30:00Z',
            updated_at: '2026-09-25T10:30:00Z',
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function createMockTask(overrides?: Partial<DeliveryTaskResponse>): DeliveryTaskResponse {
  return {
    id: 'task-uuid-501',
    order_id: 'order-uuid-999',
    vendor_order_id: 'vendor-order-1',
    rider_id: null,
    status: 'pending',
    pickup_address: '15 Admiralty Way',
    pickup_city: 'Lagos',
    pickup_phone: '+2348000000003',
    dropoff_address: '12 Victoria Island',
    dropoff_city: 'Lagos',
    dropoff_phone: '+2348000000001',
    delivery_fee: '1500.00',
    dispatch_earnings: '1200.00',
    created_at: '2026-09-25T10:35:00Z',
    updated_at: '2026-09-25T10:35:00Z',
    ...overrides,
  };
}

export function createMockTrackingSummary(overrides?: Partial<TrackingSummaryResponse>): TrackingSummaryResponse {
  return {
    order_id: 'order-uuid-999',
    order_number: 'ORD-2026-0001',
    status: 'in_transit',
    customer_id: 'user-uuid-1',
    delivery_address: '12 Victoria Island',
    delivery_city: 'Lagos',
    delivery_phone: '+2348000000001',
    vendor_orders: [],
    delivery_tasks: [],
    latest_rider_location: {
      latitude: 6.4281,
      longitude: 3.4219,
      heading: 90,
      speed: 35,
      updated_at: '2026-09-25T11:00:00Z',
    },
    ...overrides,
  };
}

export function createMockTicket(ticket = 'ephemeral-ticket-xyz-999'): TicketResponse {
  return {
    ticket,
    expires_in_seconds: 30,
    token_type: 'ticket',
  };
}

export function createErrorEnvelope(
  code: string,
  message: string,
  details?: Record<string, unknown>[]
) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
