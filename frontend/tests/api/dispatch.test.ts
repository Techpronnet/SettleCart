/**
 * Tier 1 & Tier 2 Tests: Dispatch & Operations Domain API (F7)
 * 
 * Verifies available task querying, rider assigned task querying, task inspection,
 * customer 6-digit OTP verification code security, state machine transitions
 * (accept, pickup, start transit, verify delivery), rider GPS telemetry updates,
 * and operational failure recording.
 */

import {
  createErrorEnvelope,
  createMockTask,
  MockFetchServer,
  MockStorageManager,
} from './test-helpers';

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  acceptTask,
  dispatch,
  failTask,
  getAvailableTasks,
  getMyTasks,
  getTask,
  getVerificationCode,
  pickupTask,
  startDelivery,
  updateRiderLocation,
  verifyDeliveryOtp,
} from '../../src/lib/api/domains/dispatch';
import { ApiError } from '../../src/lib/api/types';

describe('Dispatch & Operations Domain API (F7)', () => {
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

  describe('1. getAvailableTasks() & getMyTasks() Workload Management', () => {
    it('retrieves unassigned available delivery tasks filtered by city and pagination', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/available', (req) => {
        assert.ok(req.url.includes('city=Lagos'));
        assert.ok(req.url.includes('page=1'));
        assert.ok(req.url.includes('size=10'));

        return {
          status: 200,
          body: {
            tasks: [
              createMockTask({ id: 'task-1', status: 'pending', pickup_city: 'Lagos' }),
              createMockTask({ id: 'task-2', status: 'pending', pickup_city: 'Lagos' }),
            ],
            total: 2,
            page: 1,
            size: 10,
          },
        };
      });

      const response = await getAvailableTasks({
        city: 'Lagos',
        page: 1,
        size: 10,
      });

      assert.equal(response.tasks.length, 2);
      assert.equal(response.total, 2);
      assert.equal(response.tasks[0].id, 'task-1');
      assert.equal(response.tasks[0].status, 'pending');
    });

    it('retrieves rider assigned tasks filtered by operational status', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/my', (req) => {
        assert.ok(req.url.includes('status=in_transit'));

        return {
          status: 200,
          body: {
            tasks: [
              createMockTask({
                id: 'task-active-1',
                rider_id: 'rider-uuid-1',
                status: 'in_transit',
              }),
            ],
            total: 1,
            page: 1,
            size: 20,
          },
        };
      });

      const response = await getMyTasks({
        status: 'in_transit',
      });

      assert.equal(response.tasks.length, 1);
      assert.equal(response.tasks[0].id, 'task-active-1');
      assert.equal(response.tasks[0].status, 'in_transit');
    });

    it('retrieves all rider tasks when no filter parameters are passed', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/my', () => {
        return {
          status: 200,
          body: {
            tasks: [
              createMockTask({ id: 'task-all-1', status: 'assigned' }),
              createMockTask({ id: 'task-all-2', status: 'delivered' }),
            ],
            total: 2,
            page: 1,
            size: 20,
          },
        };
      });

      const response = await getMyTasks();
      assert.equal(response.tasks.length, 2);
      assert.equal(response.total, 2);
    });
  });

  describe('2. getTask() Operational Details Inspection', () => {
    it('retrieves comprehensive task details with order and customer phone', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501', () => {
        return {
          status: 200,
          body: {
            ...createMockTask({ id: 'task-uuid-501' }),
            order_number: 'ORD-2026-0001',
            store_name: 'Fresh Mart Lekki',
            rider_name: 'Babajide Driver',
            rider_phone: '+2348000000002',
          },
        };
      });

      const task = await getTask('task-uuid-501');

      assert.equal(task.id, 'task-uuid-501');
      assert.equal(task.order_number, 'ORD-2026-0001');
      assert.equal(task.store_name, 'Fresh Mart Lekki');
      assert.equal(task.pickup_address, '15 Admiralty Way');
      assert.equal(task.dropoff_address, '12 Victoria Island');
    });

    it('throws 404 ApiError when task ID is non-existent', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/missing-task', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Delivery task not found'),
        };
      });

      await assert.rejects(
        async () => {
          await getTask('missing-task');
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

  describe('3. getVerificationCode() Customer Handover OTP Security', () => {
    it('returns 6-digit delivery verification code strictly for authorized customer', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/verification-code', () => {
        return {
          status: 200,
          body: {
            delivery_task_id: 'task-uuid-501',
            order_id: 'order-uuid-999',
            vendor_order_id: 'vendor-order-1',
            verification_code: '492817',
            expires_at: '2026-09-25T14:00:00Z',
            is_verified: false,
          },
        };
      });

      const otpResponse = await getVerificationCode('task-uuid-501');

      assert.equal(otpResponse.delivery_task_id, 'task-uuid-501');
      assert.equal(otpResponse.verification_code, '492817');
      assert.equal(otpResponse.is_verified, false);
      assert.match(otpResponse.verification_code, /^\d{6}$/);
    });

    it('throws 403 Forbidden ApiError when rider attempts unauthorized OTP access', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/verification-code', () => {
        return {
          status: 403,
          body: createErrorEnvelope('forbidden', 'Only the ordering customer or admin can access verification code'),
        };
      });

      await assert.rejects(
        async () => {
          await getVerificationCode('task-uuid-501');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 403);
          assert.equal(err.code, 'forbidden');
          assert.ok(err.isForbidden);
          return true;
        }
      );
    });
  });

  describe('4. Rider State Machine: acceptTask(), pickupTask(), startDelivery()', () => {
    it('acceptTask transitions task from ASSIGNED to ACCEPTED', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/accept', () => {
        return {
          status: 200,
          body: createMockTask({
            id: 'task-uuid-501',
            status: 'accepted',
            accepted_at: '2026-09-25T11:05:00Z',
          }),
        };
      }, { method: 'POST' });

      const updated = await acceptTask('task-uuid-501');

      assert.equal(updated.id, 'task-uuid-501');
      assert.equal(updated.status, 'accepted');
      assert.equal(updated.accepted_at, '2026-09-25T11:05:00Z');
    });

    it('pickupTask transitions task to PICKED_UP upon vendor store collection', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/pickup', () => {
        return {
          status: 200,
          body: createMockTask({
            id: 'task-uuid-501',
            status: 'picked_up',
            picked_up_at: '2026-09-25T11:20:00Z',
          }),
        };
      }, { method: 'POST' });

      const updated = await pickupTask('task-uuid-501');

      assert.equal(updated.status, 'picked_up');
      assert.equal(updated.picked_up_at, '2026-09-25T11:20:00Z');
    });

    it('startDelivery transitions task to IN_TRANSIT towards customer dropoff', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/start', () => {
        return {
          status: 200,
          body: createMockTask({
            id: 'task-uuid-501',
            status: 'in_transit',
          }),
        };
      }, { method: 'POST' });

      const updated = await startDelivery('task-uuid-501');

      assert.equal(updated.status, 'in_transit');
    });
  });

  describe('5. verifyDeliveryOtp() Handover Validation & Settlement', () => {
    it('validates 6-digit OTP code and transitions task to DELIVERED', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/verify-delivery', (req) => {
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['code'], '492817');

        return {
          status: 200,
          body: createMockTask({
            id: 'task-uuid-501',
            status: 'delivered',
            delivered_at: '2026-09-25T11:45:00Z',
          }),
        };
      }, { method: 'POST' });

      const deliveredTask = await verifyDeliveryOtp('task-uuid-501', '492817');

      assert.equal(deliveredTask.id, 'task-uuid-501');
      assert.equal(deliveredTask.status, 'delivered');
      assert.equal(deliveredTask.delivered_at, '2026-09-25T11:45:00Z');
    });

    it('throws 400 ApiError on incorrect or expired 6-digit OTP code', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/verify-delivery', () => {
        return {
          status: 400,
          body: createErrorEnvelope('invalid_verification_code', 'Invalid or expired delivery verification code'),
        };
      }, { method: 'POST' });

      await assert.rejects(
        async () => {
          await verifyDeliveryOtp('task-uuid-501', '000000');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 400);
          assert.equal(err.code, 'invalid_verification_code');
          return true;
        }
      );
    });
  });

  describe('6. updateRiderLocation() Telemetry & failTask() Operational Reporting', () => {
    it('streams rider GPS coordinate updates to backend telemetry', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/location', (req) => {
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['latitude'], 6.4281);
        assert.equal(bodyObj['longitude'], 3.4219);
        assert.equal(bodyObj['heading'], 180);
        assert.equal(bodyObj['speed'], 42);

        return {
          status: 200,
          body: {
            task_id: 'task-uuid-501',
            latitude: 6.4281,
            longitude: 3.4219,
            heading: 180,
            speed: 42,
            updated_at: '2026-09-25T11:30:00Z',
          },
        };
      }, { method: 'POST' });

      const locationResponse = await updateRiderLocation('task-uuid-501', {
        latitude: 6.4281,
        longitude: 3.4219,
        heading: 180,
        speed: 42,
      });

      assert.equal(locationResponse.task_id, 'task-uuid-501');
      assert.equal(locationResponse.latitude, 6.4281);
      assert.equal(locationResponse.longitude, 3.4219);
      assert.equal(locationResponse.speed, 42);
    });

    it('records operational delivery failure with reason code and notes', async () => {
      fetchServer.mock('/api/v1/dispatch/tasks/task-uuid-501/fail', (req) => {
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['reason'], 'customer_unreachable');
        assert.equal(bodyObj['notes'], 'Attempted phone call 3 times, gate security unresponsive');

        return {
          status: 200,
          body: createMockTask({
            id: 'task-uuid-501',
            status: 'failed',
            failure_reason: 'customer_unreachable',
            notes: 'Attempted phone call 3 times, gate security unresponsive',
            failed_at: '2026-09-25T12:00:00Z',
          }),
        };
      }, { method: 'POST' });

      const failedTask = await failTask(
        'task-uuid-501',
        'customer_unreachable',
        'Attempted phone call 3 times, gate security unresponsive'
      );

      assert.equal(failedTask.id, 'task-uuid-501');
      assert.equal(failedTask.status, 'failed');
      assert.equal(failedTask.failure_reason, 'customer_unreachable');
      assert.equal(failedTask.failed_at, '2026-09-25T12:00:00Z');
    });
  });

  describe('7. Dispatch Domain Barrel Export', () => {
    it('exports all domain functions on dispatch namespace object', () => {
      assert.equal(typeof dispatch.getAvailableTasks, 'function');
      assert.equal(typeof dispatch.getMyTasks, 'function');
      assert.equal(typeof dispatch.getTask, 'function');
      assert.equal(typeof dispatch.getVerificationCode, 'function');
      assert.equal(typeof dispatch.acceptTask, 'function');
      assert.equal(typeof dispatch.pickupTask, 'function');
      assert.equal(typeof dispatch.startDelivery, 'function');
      assert.equal(typeof dispatch.verifyDeliveryOtp, 'function');
      assert.equal(typeof dispatch.updateRiderLocation, 'function');
      assert.equal(typeof dispatch.failTask, 'function');
    });
  });
});
