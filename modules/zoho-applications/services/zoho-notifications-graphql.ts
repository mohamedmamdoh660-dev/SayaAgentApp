export const GET_NOTIFICATIONS = `
 
  query GetNotifications(
  $agent_id: UUID
  $agency_id: UUID
  $limit: Int
  $offset: Int
  $only_unread: Boolean
) {
  zoho_notificationsCollection(
    filter: {
      or: [
        {
          and: [
            { user_id: { eq: $agent_id } }
                      ]
        },
        {
          and: [
            { user_id: { eq: null } }
            { agency_id: { eq: $agency_id } }
          ]
        }
      ]
    }
    first: $limit
    offset: $offset
    orderBy: [{ created_at: DescNullsLast }]
  ) {
    edges {
      node {
        id
        created_at
        updated_at
        title
        content
        module_name
        agency_id
        module_id
        user_id
        priority
        is_read
      }
    }
  }
}


`;

export const INSERT_NOTIFICATION = `
  mutation InsertNotification($objects: [zoho_notificationsInsertInput!]!) {
    insertIntozoho_notificationsCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const MARK_NOTIFICATIONS_READ = `
  mutation MarkNotificationsRead($agent_id: UUID!) {
    updatezoho_notificationsCollection(
      filter: { agent_id: { eq: $agent_id }, is_read: { eq: false } }
      set: { is_read: true }
    ) {
      records { id is_read }
    }
  }
`;

export const MARK_NOTIFICATION_READ = `
  mutation MarkNotificationRead($id: String!) {
    updatezoho_notificationsCollection(
      filter: { id: { eq: $id } }
      set: { is_read: true }
    ) {
      records { id is_read }
    }
  }
`;


