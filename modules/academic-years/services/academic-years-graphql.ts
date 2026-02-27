export const GET_ACADEMIC_YEARS = `
  query GetAcademicYears($filter: zoho_academic_yearsFilter, $limit: Int!, $offset: Int!, $orderBy: [zoho_academic_yearsOrderBy!]) {
    zoho_academic_yearsCollection(
      filter: $filter
      first: $limit
      offset: $offset
    orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          active
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_ACADEMIC_YEAR_BY_ID = `
  query GetAcademicYearById($id: String!) {
    zoho_academic_yearsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          name
          active
          created_at
          updated_at
        }
      }
    }
  }
`;

export const CREATE_ACADEMIC_YEAR = `
  mutation CreateAcademicYear($objects: [zoho_academic_yearsInsertInput!]!) {
    insertIntozoho_academic_yearsCollection(objects: $objects) {
      records {
        id
        name
        active
        created_at
        updated_at
      }
    }
  }
`;

export const UPDATE_ACADEMIC_YEAR = `
  mutation UpdateAcademicYear(
    $id: String!
    $name: String
    $active: Boolean
  ) {
    updatezoho_academic_yearsCollection(
      filter: { id: { eq: $id } }
      set: { 
        name: $name, 
        active: $active,
        updated_at: "now()"
      }
    ) {
      records {
        id
        name
        active
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_ACADEMIC_YEAR = `
  mutation DeleteAcademicYear($id: String!) {
    deleteFromzoho_academic_yearsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;