export const GET_FACULTIES = `
  query GetFaculties($filter: zoho_facultyFilter, $limit: Int, $offset: Int) {
    zoho_facultyCollection(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          active
          created_at
          update_at
        }
      }
    }
  }
`;

export const GET_FACULTIES_PAGINATION = `
  query GetFacultiesPagination($search: String!, $limit: Int!, $offset: Int!, $orderBy: [zoho_facultyOrderBy!]) {
    zoho_facultyCollection(filter: {name: {ilike: $search}}, first: $limit, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          id
          name
          active
          created_at
          update_at
        }
      }
    }
  }
`;

export const GET_FACULTY_BY_ID = `
  query GetFacultyById($id: String!) {
    zoho_facultyCollection(filter: {id: {eq: $id}}) {
      edges {
        node {
          id
          name
          active
          created_at
          update_at
        }
      }
    }
  }
`;

export const INSERT_FACULTY = `
  mutation InsertFaculty($objects: [zoho_facultyInsertInput!]!) {
    insertIntozoho_facultyCollection(objects: $objects) {
      records {
        id
        name
        active
        created_at
        update_at
      }
    }
  }
`;

export const UPDATE_FACULTY = `
  mutation UpdateFaculty($id: String!, $name: String, $active: Boolean) {
    updatezoho_facultyCollection(set: {name: $name, active: $active}, filter: {id: {eq: $id}}) {
      records {
        id
        name
        active
        created_at
        update_at
      }
    }
  }
`;

export const DELETE_FACULTY = `
  mutation DeleteFaculty($id: String!) {
    deleteFromzoho_facultyCollection(filter: {id: {eq: $id}}) {
      records {
        id
      }
    }
  }
`;
