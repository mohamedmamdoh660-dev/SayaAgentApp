export const GET_APPLICATION_NOTES = `
  query GetApplicationNotes($application_id: String!, $limit: Int, $offset: Int) {
    zoho_application_notesCollection(
      filter: { application_id: { eq: $application_id } }
      first: $limit
      offset: $offset
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          created_at
          content
          user_type
          application_id
          title
          is_read
        }
      }
    }
  }
`;

export const INSERT_APPLICATION_NOTE = `
  mutation InsertApplicationNote($objects: [zoho_application_notesInsertInput!]!) {
    insertIntozoho_application_notesCollection(objects: $objects) {
      records {
        id
        created_at
        content
        user_type
        application_id
        title
        is_read
      }
    }
  }
`;

export const MARK_APPLICATION_NOTES_READ = `
  mutation MarkApplicationNotesRead($application_id: String!) {
    updatezoho_application_notesCollection(
      filter: { application_id: { eq: $application_id }, is_read: { eq: false } }
      set: { is_read: true }

    ) {
      records { id is_read }
    }
  }
`;


