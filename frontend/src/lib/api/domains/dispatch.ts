/**
 * SettleCart Dispatch & Operations Domain API Module
 * 
 * Provides typed operations for dispatch riders and platform administrators:
 * - Querying available unassigned delivery tasks
 * - Querying assigned tasks for current rider
 * - Retrieving operational task details
 * - Inspecting customer 6-digit handover OTP (customer / admin only)
 * - State machine transitions: accept, pickup, start transit
 * - OTP handover delivery verification
 * - High-frequency GPS telemetry streaming
 * - Operational failure reporting
 */

import { client } from '../client';
import {
  ApiError,
  type CustomerVerificationCodeResponse,
  type DeliveryTaskDetailResponse,
  type DeliveryTaskListResponse,
  type DeliveryTaskResponse,
  type DeliveryTaskStatus,
  type RiderLocationResponse,
  type UpdateRiderLocationRequest,
} from '../types';

export interface AvailableTasksParams {
  city?: string | null;
  page?: number;
  size?: number;
}

export interface MyTasksParams {
  status?: DeliveryTaskStatus | null;
  page?: number;
  size?: number;
}

/**
 * Retrieves unassigned delivery tasks in PENDING status, optionally filtered by city.
 */
export async function getAvailableTasks(
  params?: AvailableTasksParams
): Promise<DeliveryTaskListResponse> {
  const { data } = await client.GET('/api/v1/dispatch/tasks/available', {
    params: {
      query: {
        city: params?.city,
        page: params?.page,
        size: params?.size,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to retrieve available delivery tasks');
  }

  return data;
}

/**
 * Retrieves tasks assigned to the currently authenticated dispatch rider.
 */
export async function getMyTasks(params?: MyTasksParams): Promise<DeliveryTaskListResponse> {
  const { data } = await client.GET('/api/v1/dispatch/tasks/my', {
    params: {
      query: {
        status: params?.status,
        page: params?.page,
        size: params?.size,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to retrieve rider delivery tasks');
  }

  return data;
}

/**
 * Retrieves full operational details of a specific delivery task by task UUID.
 */
export async function getTask(taskId: string): Promise<DeliveryTaskDetailResponse> {
  const { data } = await client.GET('/api/v1/dispatch/tasks/{task_id}', {
    params: {
      path: {
        task_id: taskId,
      },
    },
  });

  if (!data) {
    throw new ApiError(404, 'not_found', `Delivery task with ID "${taskId}" not found`);
  }

  return data;
}

/**
 * Retrieves the 6-digit delivery verification code strictly for the ordering customer or admin.
 * Throws 403 Forbidden if accessed by a dispatch rider.
 */
export async function getVerificationCode(
  taskId: string
): Promise<CustomerVerificationCodeResponse> {
  const { data } = await client.GET('/api/v1/dispatch/tasks/{task_id}/verification-code', {
    params: {
      path: {
        task_id: taskId,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to retrieve delivery verification code');
  }

  return data;
}

/**
 * Assigned rider accepts the task, transitioning it from ASSIGNED to ACCEPTED.
 */
export async function acceptTask(taskId: string): Promise<DeliveryTaskResponse> {
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/accept', {
    params: {
      path: {
        task_id: taskId,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', `Failed to accept task "${taskId}"`);
  }

  return data;
}

/**
 * Rider confirms package pickup from the vendor store, transitioning task to PICKED_UP.
 */
export async function pickupTask(taskId: string): Promise<DeliveryTaskResponse> {
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/pickup', {
    params: {
      path: {
        task_id: taskId,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', `Failed to confirm pickup for task "${taskId}"`);
  }

  return data;
}

/**
 * Rider begins transit towards customer destination, transitioning task to IN_TRANSIT.
 */
export async function startDelivery(taskId: string): Promise<DeliveryTaskResponse> {
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/start', {
    params: {
      path: {
        task_id: taskId,
      },
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', `Failed to start transit for task "${taskId}"`);
  }

  return data;
}

/**
 * Rider submits the customer's 6-digit OTP code at handover point.
 * Validates receipt, finishes delivery, triggers automatic settlement, and transitions to DELIVERED.
 */
export async function verifyDeliveryOtp(taskId: string, code: string): Promise<DeliveryTaskResponse> {
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/verify-delivery', {
    params: {
      path: {
        task_id: taskId,
      },
    },
    body: {
      code,
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to verify delivery code');
  }

  return data;
}

/**
 * Streams high-frequency rider GPS telemetry coordinates to Redis pub/sub and cache.
 */
export async function updateRiderLocation(
  taskId: string,
  location: UpdateRiderLocationRequest
): Promise<RiderLocationResponse> {
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/location', {
    params: {
      path: {
        task_id: taskId,
      },
    },
    body: location,
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to update rider location');
  }

  return data;
}

/**
 * Records an operational failure on an active delivery task (e.g. customer unreachable, accident).
 */
export async function failTask(
  taskId: string,
  reason: string,
  notes?: string | null
): Promise<DeliveryTaskResponse> {
  const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/fail', {
    params: {
      path: {
        task_id: taskId,
      },
    },
    body: {
      reason,
      notes: notes ?? null,
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', `Failed to record failure for task "${taskId}"`);
  }

  return data;
}

export const dispatch = {
  getAvailableTasks,
  getMyTasks,
  getTask,
  getVerificationCode,
  acceptTask,
  pickupTask,
  startDelivery,
  verifyDeliveryOtp,
  updateRiderLocation,
  failTask,
};

export default dispatch;
