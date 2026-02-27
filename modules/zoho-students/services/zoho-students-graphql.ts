export const GET_STUDENTS = `
  query GetStudents {
    zoho_studentsCollection {
      edges {
        node {
          id
          created_at
          updated_at
          first_name
          last_name
          gender
          date_of_birth
          nationality
          passport_number
          passport_issue_date
          passport_expiry_date
          country_of_residence
          email
          mobile
          father_name
          father_mobile
          father_job
          mother_name
          mother_mobile
          mother_job
        }
      }
    }
  }
`;

export const GET_STUDENTS_PAGINATION = `
  query GetStudentsPagination($search: String!, $limit: Int!, $offset: Int!, $filter: zoho_studentsFilter) {
    zoho_studentsCollection(
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
          first_name
          last_name
          gender
          date_of_birth
          nationality
          passport_number
          passport_issue_date
          passport_expiry_date
          country_of_residence
          email
          mobile
          father_name
          father_mobile
          father_job
          mother_name
          agent: user_profile {
            first_name
            last_name
            email
            profile
          }
          mother_mobile
          mother_job
         nationality_record:  zoho_countries  {
         id
            name
        }
            country_of_residence_record: zoho_countries {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_STUDENTS_COUNT = `
  query GetStudentsCount($search: String!) {
    zoho_studentsCollection(
      filter: { or: [
        { first_name: { like: $search } },
        { last_name: { like: $search } },
        { email: { like: $search } }
      ] }
    ) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

export const GET_STUDENT_BY_ID = `
  query GetStudentById($id: ID!) {
    zoho_studentsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          created_at
          updated_at
          first_name
          last_name
          gender
          date_of_birth
          nationality
          passport_number
          passport_issue_date
          passport_expiry_date
          country_of_residence
          email
          mobile
          father_name
          father_mobile
          father_job
          mother_name
          mother_mobile
          mother_job
          crm_id
          photo_url
          documents
          education_level
          education_level_name
          high_school_country
          high_school_name
          high_school_gpa_percent
          bachelor_school_name
          bachelor_country
          bachelor_gpa_percent
          master_school_name
          master_country
          master_gpa_percent
          transfer_student
          have_tc
          tc_number
          blue_card
          student_id
          address_line_1
          city_district
          state_province
          postal_code
          address_country
        }
      }
    }
  }
`;

export const INSERT_STUDENT = `
  mutation InsertStudent($objects: [zoho_studentsInsertInput!]!) {
    insertIntozoho_studentsCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const UPDATE_STUDENT = `
  mutation UpdateStudent(
    $id: ID!
    $first_name: String
    $last_name: String
    $gender: String
    $date_of_birth: String
    $nationality: String
    $passport_number: String
    $passport_issue_date: String
    $passport_expiry_date: String
    $country_of_residence: String
    $email: String
    $mobile: String
    $father_name: String
    $father_mobile: String
    $father_job: String
    $mother_name: String
    $mother_mobile: String
    $mother_job: String
    $crm_id: String
    $photo_url: String
    $documents: String
    $education_level: String
    $education_level_name: String
    $high_school_country: String
    $high_school_name: String
    $high_school_gpa_percent: String
    $bachelor_school_name: String
    $bachelor_country: String
    $bachelor_gpa_percent: String
    $master_school_name: String
    $master_country: String
    $master_gpa_percent: String
    $transfer_student: String
    $have_tc: String
    $tc_number: String
    $blue_card: String
    $student_id: String
    $address_line_1: String
    $city_district: String
    $state_province: String
    $postal_code: String
    $address_country: String
  ) {
    updatezoho_studentsCollection(
      filter: { id: { eq: $id } }
      set: {
        first_name: $first_name
        last_name: $last_name
        gender: $gender
        date_of_birth: $date_of_birth
        nationality: $nationality
        passport_number: $passport_number
        passport_issue_date: $passport_issue_date
        passport_expiry_date: $passport_expiry_date
        country_of_residence: $country_of_residence
        email: $email
        mobile: $mobile
        father_name: $father_name
        father_mobile: $father_mobile
        father_job: $father_job
        mother_name: $mother_name
        mother_mobile: $mother_mobile
        mother_job: $mother_job
        crm_id: $crm_id
        photo_url: $photo_url
        documents: $documents
        education_level: $education_level
        education_level_name: $education_level_name
        high_school_country: $high_school_country
        high_school_name: $high_school_name
        high_school_gpa_percent: $high_school_gpa_percent
        bachelor_school_name: $bachelor_school_name
        bachelor_country: $bachelor_country
        bachelor_gpa_percent: $bachelor_gpa_percent
        master_school_name: $master_school_name
        master_country: $master_country
        master_gpa_percent: $master_gpa_percent
        transfer_student: $transfer_student
        have_tc: $have_tc
        tc_number: $tc_number
        blue_card: $blue_card
        student_id: $student_id
        address_line_1: $address_line_1
        city_district: $city_district
        state_province: $state_province
        postal_code: $postal_code
        address_country: $address_country
        updated_at: "now()"
      }
    ) {
      records {
        id
      }
    }
  }
`;

export const DELETE_STUDENT = `
  mutation DeleteStudent($id: ID!) {
    deleteFromzoho_studentsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;