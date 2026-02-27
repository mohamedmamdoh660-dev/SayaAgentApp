import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  DELETE_DEGREE,
  GET_DEGREES,
  GET_DEGREE_BY_ID,
  GET_DEGREES_PAGINATION,
  INSERT_DEGREE,
  UPDATE_DEGREE
} from "./zoho-degrees-graphql";
import { ZohoDegree } from "@/types/types";
import { getTableCount } from "@/supabase/actions/db-actions";

export const zohoDegreesService = {
  /**
   * Get all degrees
   */
  getDegrees: async (search: string = "", page: number = 1, pageSize: number = 10, id: string | null = null) => {
    const offset = (page) * pageSize;
    const searchPattern = `%${search}%`;
    const filter = id ? { name: { ilike: searchPattern }, id: { eq: id } } : { name: { ilike: searchPattern } };
    const response = await executeGraphQLBackend(GET_DEGREES, { filter, limit: pageSize, offset });
    return response.zoho_degreesCollection.edges.map((edge: any) => edge.node);
  },

  /**
   * Get degrees with pagination
   */
  getDegreesPagination: async (search: string, limit: number, offset: number, sorting?: { sortBy?: string; sortOrder?: "asc" | "desc" }) => {
    const orderBy = (sorting && sorting.sortBy)
      ? [{ [sorting.sortBy]: sorting.sortOrder === "asc" ? 'AscNullsLast' : 'DescNullsLast' }]
      : [{ name: 'AscNullsLast' }];
    const response = await executeGraphQLBackend(GET_DEGREES_PAGINATION, { search, limit,offset: limit * offset, orderBy});
    const raw = search || "";
    const term = raw.replace(/^%|%$/g, "");
    const totalCount = await getTableCount('zoho_degrees', { name: term, code: term });
    return {
      degrees: response.zoho_degreesCollection.edges.map((edge: any) => edge.node),
      totalCount
    };
  },

  /**
   * Get a degree by ID
   */
  getDegreeById: async (id: string) => {
    try {
      const response = await executeGraphQLBackend(GET_DEGREE_BY_ID, { id });
      return response.zoho_degreesCollection.edges[0]?.node || null;
    } catch (error) {
      console.error('Error getting degree by id:', error);
      throw error;
    }
  },

  /**
   * Create a new degree
   */
  createDegree: async (data: Partial<ZohoDegree>) => {
    try {
      const response = await executeGraphQLBackend(INSERT_DEGREE, {
        objects: [{
          name: data.name,
          code: data.code,
          active: data.active !== undefined ? data.active : true
        }]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_degreesCollection.records[0];
    } catch (error) {
      console.error('Error creating degree:', error);
      throw error;
    }
  },

  /**
   * Update a degree
   */
  updateDegree: async (data: Partial<ZohoDegree>): Promise<void> => {
    try {
      const response = await executeGraphQLBackend(UPDATE_DEGREE, {
        id: data.id,
        name: data.name,
        code: data.code,
        active: data.active
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      console.error('Error updating degree:', error);
      throw error;
    }
  },

  /**
   * Delete a degree
   */
  deleteDegree: async (id: string): Promise<void> => {
    try {
      await executeGraphQLBackend(DELETE_DEGREE, { id });
    } catch (error) {
      console.error('Error deleting degree:', error);
      throw error;
    }
  }
};
