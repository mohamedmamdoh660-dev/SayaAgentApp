export const GET_LANGUAGES = `
  query GetLanguages($filter: zoho_languagesFilter, $limit: Int, $offset: Int) {
    zoho_languagesCollection(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_LANGUAGES_PAGINATION = `
  query GetLanguagesPagination($search: String!, $limit: Int!, $offset: Int!, $orderBy: [zoho_languagesOrderBy!]) {
    zoho_languagesCollection(filter: {name: {ilike: $search}}, first: $limit, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          id
          name
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_LANGUAGE_BY_ID = `
  query GetLanguageById($id: String!) {
    zoho_languagesCollection(filter: {id: {eq: $id}}) {
      edges {
        node {
          id
          name
          created_at
          updated_at
        }
      }
    }
  }
`;

export const INSERT_LANGUAGE = `
  mutation InsertLanguage($objects: [zoho_languagesInsertInput!]!) {
    insertIntozoho_languagesCollection(objects: $objects) {
      records {
        id
        name
        created_at
        updated_at
      }
    }
  }
`;

export const UPDATE_LANGUAGE = `
  mutation UpdateLanguage($id: String!, $name: String) {
    updatezoho_languagesCollection(set: {name: $name}, filter: {id: {eq: $id}}) {
      records {
        id
        name
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_LANGUAGE = `
  mutation DeleteLanguage($id: String!) {
    deleteFromzoho_languagesCollection(filter: {id: {eq: $id}}) {
      records {
        id
      }
    }
  }
`;
