export const GET_UNIVERSITIES = `
  query GetUniversities($filter: zoho_universitiesFilter, $limit: Int!, $offset: Int!, $orderBy: [zoho_universitiesOrderBy!]) {
    zoho_universitiesCollection(
      filter: $filter
      first: $limit
      offset: $offset
    orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          sector
          acomodation
          phone
          wesbite
          logo
          profile_image
          address
          city
          active
          country
          created_at
          update_at
          zoho_cities {
            id
            name
          }
          zoho_countries {
            id
            name
            country_code
          }
        }
      }
    }
  }
`;

export const GET_UNIVERSITY_BY_ID = `
  query GetUniversityById($id: String!) {
    zoho_universitiesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          name
          sector
          acomodation
          phone
          wesbite
          logo
          profile_image
          address
          city
          country
          created_at
          update_at
          year_founded
          qs_rank
          admission_email
          active
          active_in_apps
          description
          zoho_cities {
            id
            name
          }
          zoho_countries {
            id
            name
            country_code
          }
        }
      }
    }
  }
`;

export const GET_COUNTRIES = `
  query GetCountries($limit: Int!) {
    zoho_countriesCollection(
      first: $limit
      orderBy: [{ name: AscNullsLast }]
    ) {
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

export const GET_CITIES_BY_COUNTRY = `
  query GetCitiesByCountry($countryId: String!) {
    zoho_citiesCollection(filter: { country: { eq: $countryId } }) {
      edges {
        node {
          id
          name
          country
        }
      }
    }
  }
`;

export const CREATE_UNIVERSITY = `
  mutation CreateUniversity($objects: [zoho_universitiesInsertInput!]!) {
    insertIntozoho_universitiesCollection(objects: $objects) {
      records {
        id
        name
        sector
        acomodation
        phone
        wesbite
        logo
        profile_image
        address
        city
        country
        created_at
        update_at
      }
    }
  }
`;

export const UPDATE_UNIVERSITY = `
  mutation UpdateUniversity(
    $id: String!
    $name: String
    $sector: String
    $acomodation: String
    $phone: String
    $wesbite: String
    $logo: String
    $profile_image: String
    $address: String
    $city: String
    $country: String
  ) {
    updatezoho_universitiesCollection(
      filter: { id: { eq: $id } }
      set: { 
        name: $name
        sector: $sector
        acomodation: $acomodation
        phone: $phone
        wesbite: $wesbite
        logo: $logo
        profile_image: $profile_image
        address: $address
        city: $city
        country: $country
        update_at: "now()"
      }
    ) {
      records {
        id
        name
        sector
        acomodation
        phone
        wesbite
        logo
        profile_image
        address
        city
        country
        created_at
        update_at
      }
    }
  }
`;

export const DELETE_UNIVERSITY = `
  mutation DeleteUniversity($id: String!) {
    deleteFromzoho_universitiesCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;