export const GET_CITIES = `
  query GetCities($filter: zoho_citiesFilter, $limit: Int, $offset: Int) {
    zoho_citiesCollection(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          country
          created_at
          updated_at
          zoho_countries {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_CITIES_PAGINATION = `
  query GetCitiesPagination($search: String!, $limit: Int!, $offset: Int!, $orderBy: [zoho_citiesOrderBy!]) {
    zoho_citiesCollection(filter: {name: {ilike: $search}}, first: $limit, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          id
          name
          country
          created_at
          updated_at
          zoho_countries {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_CITY_BY_ID = `
  query GetCityById($id: String!) {
    zoho_citiesCollection(filter: {id: {eq: $id}}) {
      edges {
        node {
          id
          name
          country
          created_at
          updated_at
          zoho_countries {
            id
            name
          }
        }
      }
    }
  }
`;

export const INSERT_CITY = `
  mutation InsertCity($objects: [zoho_citiesInsertInput!]!) {
    insertIntozoho_citiesCollection(objects: $objects) {
      records {
        id
        name
        country
        created_at
        updated_at
      }
    }
  }
`;

export const UPDATE_CITY = `
  mutation UpdateCity($id: String!, $name: String, $country: String) {
    updatezoho_citiesCollection(set: {name: $name, country: $country}, filter: {id: {eq: $id}}) {
      records {
        id
        name
        country
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_CITY = `
  mutation DeleteCity($id: String!) {
    deleteFromzoho_citiesCollection(filter: {id: {eq: $id}}) {
      records {
        id
      }
    }
  }
`;

export const GET_COUNTRIES = `
  query GetCountries($filter: zoho_countriesFilter, $limit: Int, $offset: Int) {
    zoho_countriesCollection(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          country_code
        }
      }
    }
  }
`;
