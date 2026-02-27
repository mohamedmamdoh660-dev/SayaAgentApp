
import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  DELETE_STUDENT,
  GET_STUDENTS,
  GET_STUDENTS_COUNT,
  GET_STUDENT_BY_ID,
  GET_STUDENTS_PAGINATION,
  INSERT_STUDENT,
  UPDATE_STUDENT
} from "./zoho-students-graphql";
import { ZohoStudent } from "@/types/types";
import { supabaseClient } from "@/lib/supabase-auth-client";

export const zohoStudentsService = {
  /**
   * Get all students
   */
  getStudents: async () => {
    const response = await executeGraphQLBackend(GET_STUDENTS);
    return response.zoho_studentsCollection.edges.map((edge: any) => edge.node);
  },

  /**
   * Get students with pagination
   */
// Main function to get students with pagination and search

  /**
   * Get a student by ID
   */
  getStudentById: async (id: string) => {
    try {
      const response = await executeGraphQLBackend(GET_STUDENT_BY_ID, { id });
      return response.zoho_studentsCollection.edges[0]?.node || null;
    } catch (error) {
      console.error('Error getting student by id:', error);
      throw error;
    }
  },

  /**
   * Create a new student
   */
  createStudent: async (data: Partial<ZohoStudent>) => {
    try {
      const response = await executeGraphQLBackend(INSERT_STUDENT, {
        objects: [{
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          nationality: data.nationality,
          passport_number: data.passport_number,
          passport_issue_date: data.passport_issue_date,
          passport_expiry_date: data.passport_expiry_date,
          country_of_residence: data.country_of_residence,
          email: data.email,
          mobile: data.mobile,
          father_name: data.father_name,
          father_mobile: data.father_mobile,
          father_job: data.father_job,
          mother_name: data.mother_name,
          mother_mobile: data.mother_mobile,
          mother_job: data.mother_job,
          agency_id: data.agency_id,
          user_id: data.user_id,
          crm_id: data.crm_id,
          photo_url: data.photo_url,
          documents: data.documents,
          education_level: data.education_level,
          education_level_name: data.education_level_name,
          high_school_country: data.high_school_country,
          high_school_name: data.high_school_name,
          high_school_gpa_percent: data.high_school_gpa_percent,
          bachelor_school_name: data.bachelor_school_name,
          bachelor_country: data.bachelor_country,
          bachelor_gpa_percent: data.bachelor_gpa_percent,
          master_school_name: data.master_school_name,
          master_country: data.master_country,
          master_gpa_percent: data.master_gpa_percent,
          transfer_student: data.transfer_student,
          have_tc: data.have_tc,
          tc_number: data.tc_number,
          blue_card: data.blue_card,
          student_id: data.student_id,
          address_line_1: data.address_line_1,
          city_district: data.city_district,
          state_province: data.state_province,
          postal_code: data.postal_code,
          address_country: data.address_country,
         
        }]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_studentsCollection.records[0];
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  /**
   * Update a student
   */
  updateStudent: async (data: Partial<ZohoStudent>): Promise<void> => {
    try {
      const response = await executeGraphQLBackend(UPDATE_STUDENT, {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        nationality: data.nationality,
        passport_number: data.passport_number,
        passport_issue_date: data.passport_issue_date,
        passport_expiry_date: data.passport_expiry_date,
        country_of_residence: data.country_of_residence,
        email: data.email,
        mobile: data.mobile,
        father_name: data.father_name,
        father_mobile: data.father_mobile,
        father_job: data.father_job,
        mother_name: data.mother_name,
        mother_mobile: data.mother_mobile,
        mother_job: data.mother_job,
        agency_id: data.agency_id,
        user_id: data.user_id,
        crm_id: data.crm_id,
        photo_url: data.photo_url,
        documents: data.documents,
        education_level: data.education_level,
        education_level_name: data.education_level_name,
        high_school_country: data.high_school_country,
        high_school_name: data.high_school_name,
        high_school_gpa_percent: data.high_school_gpa_percent,
        bachelor_school_name: data.bachelor_school_name,
        bachelor_country: data.bachelor_country,
        bachelor_gpa_percent: data.bachelor_gpa_percent,
        master_school_name: data.master_school_name,
        master_country: data.master_country,
        master_gpa_percent: data.master_gpa_percent,
        transfer_student: data.transfer_student,
        have_tc: data.have_tc,
        tc_number: data.tc_number,
        blue_card: data.blue_card,
        student_id: data.student_id,
        address_line_1: data.address_line_1,
        city_district: data.city_district,
        state_province: data.state_province,
        postal_code: data.postal_code,
        address_country: data.address_country,
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  /**
   * Delete a student
   */
  deleteStudent: async (id: string): Promise<void> => {
    try {
      await executeGraphQLBackend(DELETE_STUDENT, { id });
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  /**
   * Check if email already exists
   */
  checkDuplicateEmail: async (email: string, excludeId?: string): Promise<boolean> => {
    try {
      // Build filter conditionally
      let filter: any = { email: { eq: email } };
      if (excludeId) {
        filter = {
          and: [
            { email: { eq: email } },
            { id: { neq: excludeId } }
          ]
        };
      }
      
      const response = await executeGraphQLBackend(
        `query CheckDuplicateEmail($filter: zoho_studentsFilter!) {
          zoho_studentsCollection(filter: $filter, first: 1) {
            edges {
              node {
                id
                email
              }
            }
          }
        }`,
        { filter }
      );
      return response.zoho_studentsCollection.edges.length > 0;
    } catch (error) {
      console.error('Error checking duplicate email:', error);
      return false;
    }
  },

  /**
   * Check if passport number already exists
   */
  checkDuplicatePassport: async (passport_number: string, excludeId?: string): Promise<boolean> => {
    try {
      // Build filter conditionally
      let filter: any = { passport_number: { eq: passport_number } };
      if (excludeId) {
        filter = {
          and: [
            { passport_number: { eq: passport_number } },
            { id: { neq: excludeId } }
          ]
        };
      }
      
      const response = await executeGraphQLBackend(
        `query CheckDuplicatePassport($filter: zoho_studentsFilter!) {
          zoho_studentsCollection(filter: $filter, first: 1) {
            edges {
              node {
                id
                passport_number
              }
            }
          }
        }`,
        { filter }
      );
      return response.zoho_studentsCollection.edges.length > 0;
    } catch (error) {
      console.error('Error checking duplicate passport:', error);
      return false;
    }
  }
};
