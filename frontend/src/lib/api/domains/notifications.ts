/**
 * SettleCart Notifications Domain API Module
 *
 * In-app notification inbox: paginated list, unread count, mark read.
 */

import { client } from '../client';
import {
  ApiError,
  type NotificationListResponse,
  type NotificationResponse,
} from '../types';

export async function listNotifications(
  page = 1,
  size = 20
): Promise<NotificationListResponse> {
  const { data } = await client.GET('/api/v1/notifications/', {
    params: { query: { page, size } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve notifications');
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await client.GET('/api/v1/notifications/unread-count');
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to retrieve unread count');
  return data.unread_count;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationResponse> {
  const { data } = await client.PATCH('/api/v1/notifications/{notification_id}/read', {
    params: { path: { notification_id: notificationId } },
  });
  if (!data) throw new ApiError(500, 'internal_error', 'Failed to mark notification read');
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.POST('/api/v1/notifications/mark-all-read');
}

export const notifications = {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};

export default notifications;
