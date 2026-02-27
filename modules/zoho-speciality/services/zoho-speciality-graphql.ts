export const GET_SPECIALITIES = `
  query GetSpecialities($filter: zoho_specialityFilter, $limit: Int, $offset: Int) {
    zoho_specialityCollection(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          active
          created_at
          update_at
          faculty_id
          zoho_faculty {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_SPECIALITIES_PAGINATION = `
  query GetSpecialitiesPagination($search: String!, $limit: Int!, $offset: Int!, $orderBy: [zoho_specialityOrderBy!]) {
    zoho_specialityCollection(filter: {name: {ilike: $search}}, first: $limit, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          id
          name
          active
          created_at
          update_at
          faculty_id
          zoho_faculty {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_SPECIALITY_BY_ID = `
  query GetSpecialityById($id: String!) {
    zoho_specialityCollection(filter: {id: {eq: $id}}) {
      edges {
        node {
          id
          name
          active
          created_at
          update_at
          faculty_id
          zoho_faculty {
            id
            name
          }
        }
      }
    }
  }
`;

export const INSERT_SPECIALITY = `
  mutation InsertSpeciality($objects: [zoho_specialityInsertInput!]!) {
    insertIntozoho_specialityCollection(objects: $objects) {
      records {
        id
        name
        active
        created_at
        update_at
        faculty_id
      }
    }
  }
`;

export const UPDATE_SPECIALITY = `
  mutation UpdateSpeciality($id: String!, $name: String, $active: Boolean, $faculty_id: String) {
    updatezoho_specialityCollection(set: {name: $name, active: $active, faculty_id: $faculty_id}, filter: {id: {eq: $id}}) {
      records {
        id
        name
        active
        created_at
        update_at
        faculty_id
      }
    }
  }
`;

export const DELETE_SPECIALITY = `
  mutation DeleteSpeciality($id: String!) {
    deleteFromzoho_specialityCollection(filter: {id: {eq: $id}}) {
      records {
        id
      }
    }
  }
`;
