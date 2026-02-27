export const GET_COUNTRIES = `
  query GetCountries($filter: zoho_countriesFilter, $limit: Int!, $offset: Int!, $orderBy: [zoho_countriesOrderBy!]) {
    zoho_countriesCollection(
      filter: $filter
      first: $limit
      offset: $offset
    orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          country_code
          active_on_nationalities
          active_on_university
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_COUNTRY_BY_ID = `
  query GetCountryById($id: String!) {
    zoho_countriesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          name
          country_code
          active_on_nationalities
          active_on_university
          created_at
          updated_at
        }
      }
    }
  }
`;

export const CREATE_COUNTRY = `
  mutation CreateCountry($objects: [zoho_countriesInsertInput!]!) {
    insertIntozoho_countriesCollection(objects: $objects) {
      records {
        id
        name
        country_code
        active_on_nationalities
        active_on_university
        created_at
        updated_at
      }
    }
  }
`;

export const UPDATE_COUNTRY = `
  mutation UpdateCountry(
    $id: String!
    $name: String
    $country_code: String
    $active_on_nationalities: Boolean
    $active_on_university: Boolean
  ) {
    updatezoho_countriesCollection(
      filter: { id: { eq: $id } }
      set: { 
        name: $name
        country_code: $country_code
        active_on_nationalities: $active_on_nationalities
        active_on_university: $active_on_university
        updated_at: "now()"
      }
    ) {
      records {
        id
        name
        country_code
        active_on_nationalities
        active_on_university
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_COUNTRY = `
  mutation DeleteCountry($id: String!) {
    deleteFromzoho_countriesCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;