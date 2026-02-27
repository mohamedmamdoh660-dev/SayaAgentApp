import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  DELETE_SPECIALITY,
  GET_SPECIALITIES,
  GET_SPECIALITY_BY_ID,
  GET_SPECIALITIES_PAGINATION,
  INSERT_SPECIALITY,
  UPDATE_SPECIALITY
} from "./zoho-speciality-graphql";
import { ZohoSpeciality } from "@/types/types";
import { supabaseClient } from "@/lib/supabase-auth-client";

export const zohoSpecialityService = {
  /** 
   * Get all specialities
   */
  getSpecialities: async (search: string = "", page: number = 1, pageSize: number = 10, id: string | null = null) => {
    const offset = (page) * pageSize;
    const searchPattern = `%${search}%`;
    const filter = id ? { name: { ilike: searchPattern }, id: { eq: id } } : { name: { ilike: searchPattern } };
    const response = await executeGraphQLBackend(GET_SPECIALITIES, { filter, limit: pageSize, offset });
    return response.zoho_specialityCollection.edges.map((edge: any) => edge.node);
  },

  /**
   * Get specialities with pagination
   */
  getSpecialitiesPagination: async (search: string, limit: number, offset: number, sorting?: { sortBy?: string; sortOrder?: "asc" | "desc" }) => {
    const orderBy = (sorting && sorting.sortBy)
      ? [{ [sorting.sortBy]: sorting.sortOrder === "asc" ? 'AscNullsLast' : 'DescNullsLast' }]
      : [{ name: 'AscNullsLast' }];
    const response = await executeGraphQLBackend(GET_SPECIALITIES_PAGINATION, { search, limit, offset: limit * offset, orderBy });
    const countResponse = await supabaseClient
      .from('zoho_speciality')
      .select('id,name', { count: 'exact' })
      .ilike('name', `${search}`);
    return {
      specialities: response.zoho_specialityCollection.edges.map((edge: any) => edge.node),
      totalCount: countResponse.count
    };
  },

  /**
   * Get a speciality by ID
   */
  getSpecialityById: async (id: string) => {
    try {
      const response = await executeGraphQLBackend(GET_SPECIALITY_BY_ID, { id });
      return response.zoho_specialityCollection.edges[0]?.node || null;
    } catch (error) {
      console.error('Error getting speciality by id:', error);
      throw error;
    }
  },

  /**
   * Create a new speciality
   */
  createSpeciality: async (data: Partial<ZohoSpeciality>) => {
    try {
      const response = await executeGraphQLBackend(INSERT_SPECIALITY, {
        objects: [{
          name: data.name,
          active: data.active !== undefined ? data.active : true,
          faculty_id: data.faculty_id
        }]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_specialityCollection.records[0];
    } catch (error) {
      console.error('Error creating speciality:', error);
      throw error;
    }
  },

  /**
   * Update a speciality
   */
  updateSpeciality: async (data: Partial<ZohoSpeciality>): Promise<void> => {
    try {
      const response = await executeGraphQLBackend(UPDATE_SPECIALITY, {
        id: data.id,
        name: data.name,
        active: data.active,
        faculty_id: data.faculty_id
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      console.error('Error updating speciality:', error);
      throw error;
    }
  },

  /**
   * Delete a speciality
   */
  deleteSpeciality: async (id: string): Promise<void> => {
    try {
      await executeGraphQLBackend(DELETE_SPECIALITY, { id });
    } catch (error) {
      console.error('Error deleting speciality:', error);
      throw error;
    }
  },

  /**
   * Get specialities by faculty ID
   */
  getSpecialitiesByFaculty: async (facultyId: string): Promise<ZohoSpeciality[]> => {
    try {
      const response = await executeGraphQLBackend(GET_SPECIALITIES);
      const specialities = response.zoho_specialityCollection.edges.map((edge: any) => edge.node);
      return specialities.filter((spec: ZohoSpeciality) => spec.faculty_id === facultyId);
    } catch (error) {
      console.error('Error getting specialities by faculty:', error);
      throw error;
    }
  }
};
