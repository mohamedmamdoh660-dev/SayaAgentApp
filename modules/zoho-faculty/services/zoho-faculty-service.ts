import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  DELETE_FACULTY,
  GET_FACULTIES,
  GET_FACULTY_BY_ID,
  GET_FACULTIES_PAGINATION,
  INSERT_FACULTY,
  UPDATE_FACULTY
} from "./zoho-faculty-graphql";
import { ZohoFaculty } from "@/types/types";
import { getTableCount } from "@/supabase/actions/db-actions";

export const zohoFacultyService = {
  /**
   * Get all faculties
   */
  getFaculties: async (search: string = "", page: number = 1, pageSize: number = 10, id: string | null = null) => {
    const offset = (page) * pageSize;
    const searchPattern = `%${search}%`;
    const filter = id ? { name: { ilike: searchPattern }, id: { eq: id } } : { name: { ilike: searchPattern } };
    const response = await executeGraphQLBackend(GET_FACULTIES, { filter, limit: pageSize, offset });
    return response.zoho_facultyCollection.edges.map((edge: any) => edge.node);
  },

  /**
   * Get faculties with pagination
   */
  getFacultiesPagination: async (search: string, limit: number, offset: number, sorting?: { sortBy?: string; sortOrder?: "asc" | "desc" }) => {
    const orderBy = (sorting && sorting.sortBy)
      ? [{ [sorting.sortBy]: sorting.sortOrder === "asc" ? 'AscNullsLast' : 'DescNullsLast' }]
      : [{ name: 'AscNullsLast' }];
    const response = await executeGraphQLBackend(GET_FACULTIES_PAGINATION, { search, limit, offset: limit * offset, orderBy});
    const raw = search || "";
    const term = raw.replace(/^%|%$/g, "");
    const totalCount = await getTableCount('zoho_faculty', { name: term });
    return {
      faculties: response.zoho_facultyCollection.edges.map((edge: any) => edge.node),
      totalCount
    };
  },

  /**
   * Get a faculty by ID
   */
  getFacultyById: async (id: string) => {
    try {
      const response = await executeGraphQLBackend(GET_FACULTY_BY_ID, { id });
      return response.zoho_facultyCollection.edges[0]?.node || null;
    } catch (error) {
      console.error('Error getting faculty by id:', error);
      throw error;
    }
  },

  /**
   * Create a new faculty
   */
  createFaculty: async (data: Partial<ZohoFaculty>) => {
    try {
      const response = await executeGraphQLBackend(INSERT_FACULTY, {
        objects: [{
          name: data.name,
          active: data.active !== undefined ? data.active : true
        }]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_facultyCollection.records[0];
    } catch (error) {
      console.error('Error creating faculty:', error);
      throw error;
    }
  },

  /**
   * Update a faculty
   */
  updateFaculty: async (data: Partial<ZohoFaculty>): Promise<void> => {
    try {
      const response = await executeGraphQLBackend(UPDATE_FACULTY, {
        id: data.id,
        name: data.name,
        active: data.active
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  },

  /**
   * Delete a faculty
   */
  deleteFaculty: async (id: string): Promise<void> => {
    try {
      await executeGraphQLBackend(DELETE_FACULTY, { id });
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  }
};
