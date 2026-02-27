import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  GET_NOTIFICATIONS,
  INSERT_NOTIFICATION,
  MARK_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from "./zoho-notifications-graphql";

export type NotificationItem = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  title: string;
  content?: string | null;
  module_name: string;
  module_id: string;
  agency_id?: string | null;
  user_id?: string | null;
  priority?: string | null;
  is_read: boolean;
};

class NotificationsService {
  async listByUser(agent_id?: string, agency_id?: string, limit = 20, offset = 0, onlyUnread = false) {
    const data = await executeGraphQLBackend(GET_NOTIFICATIONS, {
      agent_id: agent_id || null,
      agency_id: agency_id || null,
      limit,
      offset,
      only_unread: onlyUnread,
    });
    return (
      data?.zoho_notificationsCollection?.edges?.map((e: any) => e.node) || []
    ) as NotificationItem[];
  }

  async createNotification(notification: Partial<NotificationItem>) {
    const data = await executeGraphQLBackend(INSERT_NOTIFICATION, {
      objects: [notification],
    });
    return data?.insertIntozoho_notificationsCollection?.records?.[0] as {
      id: string;
    };
  }

  async markAllRead(agent_id: string) {
    const data = await executeGraphQLBackend(MARK_NOTIFICATIONS_READ, {
      agent_id: agent_id,
    });
    return data?.updatezoho_notificationsCollection?.records as Array<{
      id: string;
      is_read: boolean;
    }>;
  }

  async markOneRead(id: string) {
    const data = await executeGraphQLBackend(MARK_NOTIFICATION_READ, {
      id,
    });
    return data?.updatezoho_notificationsCollection?.records?.[0] as
      | { id: string; is_read: boolean }
      | undefined;
  }
}

export const notificationsService = new NotificationsService();


