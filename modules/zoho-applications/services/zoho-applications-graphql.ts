export const GET_APPLICATIONS = `
  query GetApplications {
    zoho_applicationsCollection {
      edges {
        node {
          id
          created_at
          updated_at
          student
          program
          acdamic_year
          semester
          country
          university
          stage
          degree
          zoho_students {
            id
            first_name
            last_name
            email
            mobile
          }
          zoho_programs {
            id
            name
            faculty
            speciality
            degree
            language
            university
            city
            country
            zoho_degrees {
              id
              name
            }
          }
          zoho_academic_years {
            id
            name
            active
          }
          zoho_semesters {
            id
            name
            active
          }
          zoho_countries {
            id
            name
            country_code
          }
          zoho_universities {
            id
            name
            logo
            sector
          }
          zoho_degrees {
            id
            name
            code
          }
        }
      }
    }
  }
`;

export const GET_APPLICATIONS_PAGINATION = `
  query GetApplicationsPagination($search: String!, $limit: Int!, $offset: Int!, $filter: zoho_applicationsFilter) {
    zoho_applicationsCollection(
      filter: $filter
      first: $limit
      offset: $offset
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          created_at
          updated_at
          student
          program
          acdamic_year
          semester
          country
          university
          stage
          agent:user_profile {
          first_name
          last_name
          email
          profile
          }
          degree
          zoho_students {
            id
            first_name
            last_name
            email
            mobile
          }
          zoho_programs {
            id
            name
           
          }
          zoho_academic_years {
            id
            name
            active
          }
          zoho_semesters {
            id
            name
            active
          }
          zoho_countries {
            id
            name
            country_code
          }
          zoho_universities {
            id
            name
            logo
            sector
          }
          zoho_degrees {
            id
            name
            code
          }
        }
      }
    }
  }
`;

export const GET_APPLICATIONS_COUNT = `
  query GetApplicationsCount($search: String!) {
    zoho_applicationsCollection(
      filter: { 
        or: [
          { stage: { like: $search } }
        ]
      }
    ) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export const GET_APPLICATION_BY_ID = `
  query GetApplicationById($id: ID!) {
    zoho_applicationsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          created_at
          updated_at
          student
          program
          acdamic_year
          semester
          country
          university
          stage
          degree
          zoho_students {
            id
            first_name
            last_name
            email
            mobile
          }
          zoho_programs {
            id
            name
            faculty_id
            speciality_id
            degree_id
            language_id
            university_id
            city_id
            country_id
            zoho_degrees {
              id
              name
            }
          }
          zoho_academic_years {
            id
            name
            active
          }
          zoho_semesters {
            id
            name
            active
          }
          zoho_countries {
            id
            name
            country_code
          }
          zoho_universities {
            id
            name
            logo
            sector
          }
          zoho_degrees {
            id
            name
            code
          }
        }
      }
    }
  }
`;


export const GET_APPLICATIONS_BY_FILTER = `
  query GetApplicationsByFilter($filter: zoho_applicationsFilter) {
    zoho_applicationsCollection(filter: $filter) {
      edges {
        node {
          id
  
          }
        }
      }
    }
  
`;

export const INSERT_APPLICATION = `
  mutation InsertApplication($objects: [zoho_applicationsInsertInput!]!) {
    insertIntozoho_applicationsCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const UPDATE_APPLICATION = `
  mutation UpdateApplication(
    $id: ID!
    $student: String
    $program: String
    $acdamic_year: String
    $semester: String
    $country: String
    $university: String
    $stage: String
    $degree: String
  ) {
    updatezoho_applicationsCollection(
      filter: { id: { eq: $id } }
      set: {
        student: $student
        program: $program
        acdamic_year: $acdamic_year
        semester: $semester
        country: $country
        university: $university
        stage: $stage
        degree: $degree
        updated_at: "now()"
      }
    ) {
      records {
        id
      }
    }
  }
`;

export const DELETE_APPLICATION = `
  mutation DeleteApplication($id: ID!) {
    deleteFromzoho_applicationsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const GET_ZOHO_ACADEMIC_YEARS = `
  query GetZohoAcademicYears($filter: zoho_academic_yearsFilter, $limit: Int!, $offset: Int!) {
    zoho_academic_yearsCollection(
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
          is_default
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_ZOHO_SEMESTERS = `
  query GetZohoSemesters($filter: zoho_semestersFilter, $limit: Int!, $offset: Int!) {
    zoho_semestersCollection(
      filter: $filter
      first: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          name
          active
          is_default
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_ZOHO_STUDENTS = `
  query GetZohoStudents($filter: zoho_studentsFilter, $limit: Int!, $offset: Int!) {
    zoho_studentsCollection(
      filter: $filter
      first: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          first_name
          last_name
          email
          mobile
          gender
          date_of_birth
          nationality
        }
      }
    }
  }
`;

export const GET_ZOHO_STUDENTS_SEARCH = `
  query GetZohoStudentsSearch($search: String!) {
    zoho_studentsCollection(
      filter: { 
        or: [
          { first_name: { like: $search } },
          { last_name: { like: $search } },
          { email: { like: $search } }
        ]
      }
    ) {
      edges {
        node {
          id
          first_name
          last_name
          email
          mobile
        }
      }
    }
  }
`;

export const GET_APPLICATIONS_BY_STUDENT = `
  query GetApplicationsByStudent($student_id: String!) {
    zoho_applicationsCollection(filter: { student: { eq: $student_id } }, orderBy: [{ created_at: DescNullsLast }]) {
      edges {
        node {
          id
          university
          program
          acdamic_year
          semester
          stage
          zoho_universities { id name }
          zoho_programs { id name }
          zoho_academic_years { id name }
          zoho_semesters { id name }
        }
      }
    }
  }
`;



