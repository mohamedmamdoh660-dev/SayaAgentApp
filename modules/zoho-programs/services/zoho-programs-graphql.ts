export const GET_PROGRAMS = `
  query GetPrograms($filter: zoho_programsFilter, $limit: Int!, $offset: Int!) {
    zoho_programsCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
        
        }
      }
    }
  }
`;

export const GET_PROGRAMS_PAGINATION = `
  query GetProgramsPagination($search: String!, $limit: Int!, $offset: Int!, $filter: zoho_programsFilter,$orderBy: [zoho_programsOrderBy!]) {
    zoho_programsCollection(
      filter: $filter
      first: $limit
      offset: $offset
    orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          faculty_id
          speciality_id
          degree_id
          language_id
          university_id
          city_id
          country_id
          created_at
          updated_at
          official_tuition
          discounted_tuition
          tuition_currency
          active
          active_applications
          study_years
          zoho_countries {
            id
            name
            country_code
          }
          zoho_degrees {
            id
            name
          }
          zoho_faculty {
            id
            name
          }
          zoho_languages {
            id
            name
          }
          zoho_speciality {
            id
            name
          }
          zoho_cities {
            id
            name
          }
          zoho_universities {
            id
            name
            sector
            logo
          }
        }
      }
    }
  }
`;

export const GET_PROGRAMS_COUNT = `
  query GetProgramsCount($search: String!) {
    zoho_programsCollection(filter: { name: { like: $search } }) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export const GET_PROGRAM_BY_ID = `
  query GetProgramById($id: ID!) {
    zoho_programsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          name
          faculty_id
          speciality_id
          degree_id
          language_id
          university_id
          city_id
          country_id
          created_at
          updated_at
          official_tuition
          discounted_tuition
          tuition_currency
          active
          active_applications
          study_years
          zoho_countries {
            id
            name
            country_code
          }
          zoho_degrees {
            id
            name
          }
          zoho_faculty {
            id
            name
          }
          zoho_languages {
            id
            name
          }
          zoho_speciality {
            id
            name
          }
          zoho_cities {
            id
            name
          }
          zoho_universities {
            id
            name
            sector
            logo
          }
        }
      }
    }
  }
`;

export const INSERT_PROGRAM = `
  mutation InsertProgram($objects: [zoho_programsInsertInput!]!) {
    insertIntozoho_programsCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const UPDATE_PROGRAM = `
  mutation UpdateProgram(
    $id: ID!
    $name: String
    $faculty: String
    $speciality: String
    $degree: String
    $language: String
    $university: String
    $city: String
    $country: String
    $official_tuition: String
    $discounted_tuition: String
    $tuition_currency: String
    $active: Boolean
    $active_applications: Boolean
    $study_years: String
  ) {
    updatezoho_programsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        faculty: $faculty
        speciality: $speciality
        degree: $degree
        language: $language
        university: $university
        city: $city
        country: $country
        official_tuition: $official_tuition
        discounted_tuition: $discounted_tuition
        tuition_currency: $tuition_currency
        active: $active
        active_applications: $active_applications
        study_years: $study_years
        updated_at: "now()"
      }
    ) {
      records {
        id
      }
    }
  }
`;

export const DELETE_PROGRAM = `
  mutation DeleteProgram($id: ID!) {
    deleteFromzoho_programsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const GET_ZOHO_COUNTRIES = `
  query GetZohoCountries($filter: zoho_countriesFilter, $limit: Int!, $offset: Int!) {
    zoho_countriesCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
       active_on_nationalities
       active_on_university
        }
      }
    }
  }
`;

export const GET_ZOHO_CITIES = `
  query GetZohoCities($filter: zoho_citiesFilter, $limit: Int!, $offset: Int!) {
    zoho_citiesCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
         
        }
      }
    }
  }
`;

export const GET_ZOHO_CITIES_BY_COUNTRY = `
  query GetZohoCitiesByCountry($countryId: String!) {
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

export const GET_ZOHO_UNIVERSITIES = `
  query GetZohoUniversities($filter: zoho_universitiesFilter, $limit: Int!, $offset: Int!) {
    zoho_universitiesCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
        
        }
      }
    }
  }
`;

export const GET_ZOHO_UNIVERSITIES_BY_CITY = `
  query GetZohoUniversitiesByCity($cityId: String!) {
    zoho_universitiesCollection(filter: { city: { eq: $cityId } }) {
      edges {
        node {
          id
          name
          sector
          logo
        }
      }
    }
  }
`;

export const GET_ZOHO_UNIVERSITIES_BY_COUNTRY = `
  query GetZohoUniversitiesByCountry($countryId: String!) {
    zoho_universitiesCollection(filter: { country: { eq: $countryId } }) {
      edges {
        node {
          id
          name
          sector
          logo
        }
      }
    }
  }
`;

export const GET_ZOHO_DEGREES = `
  query GetZohoDegrees($filter: zoho_degreesFilter, $limit: Int!, $offset: Int!) {
    zoho_degreesCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
          code
          active
        }
      }
    }
  }
`;

export const GET_ZOHO_FACILITIES = `
  query GetZohoFacilities($filter: zoho_facultyFilter, $limit: Int!, $offset: Int!) {
    zoho_facultyCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
          active
        }
      }
    }
  }
`;

export const GET_ZOHO_LANGUAGES = `
  query GetZohoLanguages($filter: zoho_languagesFilter, $limit: Int!, $offset: Int!) {
    zoho_languagesCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

export const GET_ZOHO_SPECIALITIES = `
  query GetZohoSpecialities($filter: zoho_specialityFilter, $limit: Int!, $offset: Int!) {
    zoho_specialityCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
          active
          faculty_id
        }
      }
    }
  }
`;