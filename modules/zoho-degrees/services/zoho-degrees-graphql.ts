export const GET_DEGREES = `
  query GetDegrees($filter: zoho_degreesFilter, $limit: Int, $offset: Int) {
    zoho_degreesCollection(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          code
          active
          created_at
          update_at
        }
      }
    }
  }
`;

export const GET_DEGREES_PAGINATION = `
  query GetDegreesPagination($search: String!, $limit: Int!, $offset: Int!, $orderBy: [zoho_degreesOrderBy!]) {
    zoho_degreesCollection(filter: {name: {ilike: $search}}, first: $limit, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          id
          name
          code
          active
          created_at
          update_at
        }
      }
    }
  }
`;

export const GET_DEGREE_BY_ID = `
  query GetDegreeById($id: String!) {
    zoho_degreesCollection(filter: {id: {eq: $id}}) {
      edges {
        node {
          id
          name
          code
          active
          created_at
          update_at
        }
      }
    }
  }
`;

export const INSERT_DEGREE = `
  mutation InsertDegree($objects: [zoho_degreesInsertInput!]!) {
    insertIntozoho_degreesCollection(objects: $objects) {
      records {
        id
        name
        code
        active
        created_at
        update_at
      }
    }
  }
`;

export const UPDATE_DEGREE = `
  mutation UpdateDegree($id: String!, $name: String, $code: String, $active: Boolean) {
    updatezoho_degreesCollection(set: {name: $name, code: $code, active: $active}, filter: {id: {eq: $id}}) {
      records {
        id
        name
        code
        active
        created_at
        update_at
      }
    }
  }
`;

export const DELETE_DEGREE = `
  mutation DeleteDegree($id: String!) {
    deleteFromzoho_degreesCollection(filter: {id: {eq: $id}}) {
      records {
        id
      }
    }
  }
`;
