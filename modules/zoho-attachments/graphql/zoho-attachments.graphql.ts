export const QUERY_ATTACHMENTS_BY_MODULE_AND_ID = /* GraphQL */ `
  query AttachmentsByModule($module: String!, $module_id: String!) {
    zoho_attachmentsCollection(
      filter: { module: { eq: $module }, module_id: { eq: $module_id } }
    ) {
      edges {
        node {
          id
          name
          module
          module_id
          created_at
        }
      }
    }
  }
`;

export const QUERY_ATTACHMENTS_BY_MODULE_ID = /* GraphQL */ `
  query AttachmentsByModuleId($module_id: String!) {
    zoho_attachmentsCollection(filter: { module_id: { eq: $module_id } }) {
      edges {
        node {
          id
          name
          module
          module_id
          created_at
        }
      }
    }
  }
`;


