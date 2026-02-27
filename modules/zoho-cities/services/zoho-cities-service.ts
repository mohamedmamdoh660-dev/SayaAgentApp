import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  DELETE_CITY,
  GET_CITIES,
  GET_CITY_BY_ID,
  GET_CITIES_PAGINATION,
  INSERT_CITY,
  UPDATE_CITY,
  GET_COUNTRIES
} from "./zoho-cities-graphql";
import { ZohoCity, ZohoCountry } from "@/types/types";
import { getTableCount } from "@/supabase/actions/db-actions";

export const zohoCitiesService = {
  /**
   * Get all cities
   */
  getCities: async (search: string = "", page: number = 1, pageSize: number = 10, id: string | null = null) => {
    const offset = (page) * pageSize;
    const searchPattern = `%${search}%`;
    const filter = id ? { name: { ilike: searchPattern }, id: { eq: id } } : { name: { ilike: searchPattern } };
    const response = await executeGraphQLBackend(GET_CITIES, { filter, limit: pageSize, offset });
    return response.zoho_citiesCollection.edges.map((edge: any) => edge.node);
  },

  /**
   * Get cities with pagination
   */
  getCitiesPagination: async (search: string, limit: number, offset: number, sorting?: { sortBy?: string; sortOrder?: "asc" | "desc" }) => {
    const orderBy = (sorting && sorting.sortBy)
      ? [{ [sorting.sortBy]: sorting.sortOrder === "asc" ? 'AscNullsLast' : 'DescNullsLast' }]
      : [{ name: 'AscNullsLast' }];
    const response = await executeGraphQLBackend(GET_CITIES_PAGINATION, { search, limit, offset: limit * offset, orderBy });
    const raw = search || "";
    const term = raw.replace(/^%|%$/g, "");
    const totalCount = await getTableCount('zoho_cities', { name: term });
    return {
      cities: response.zoho_citiesCollection.edges.map((edge: any) => edge.node),
      totalCount
    };
  },

  /**
   * Get a city by ID
   */
  getCityById: async (id: string) => {
    try {
      const response = await executeGraphQLBackend(GET_CITY_BY_ID, { id });
      return response.zoho_citiesCollection.edges[0]?.node || null;
    } catch (error) {
      console.error('Error getting city by id:', error);
      throw error;
    }
  },

  /**
   * Create a new city
   */
  createCity: async (data: Partial<ZohoCity>) => {
    try {
      const response = await executeGraphQLBackend(INSERT_CITY, {
        objects: [{
          name: data.name,
          country: data.country
        }]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_citiesCollection.records[0];
    } catch (error) {
      console.error('Error creating city:', error);
      throw error;
    }
  },

  /**
   * Update a city
   */
  updateCity: async (data: Partial<ZohoCity>): Promise<void> => {
    try {
      const response = await executeGraphQLBackend(UPDATE_CITY, {
        id: data.id,
        name: data.name,
        country: data.country
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      console.error('Error updating city:', error);
      throw error;
    }
  },

  /**
   * Delete a city
   */
  deleteCity: async (id: string): Promise<void> => {
    try {
      await executeGraphQLBackend(DELETE_CITY, { id });
    } catch (error) {
      console.error('Error deleting city:', error);
      throw error;
    }
  },

  /**
   * Get all countries
   */
  getCountries: async (search: string = "", page: number = 1, pageSize: number = 10, id: string | null = null): Promise<ZohoCountry[]> => {
    try {
      const offset = (page) * pageSize;
      const searchPattern = `%${search}%`;
      const filter = id ? { name: { ilike: searchPattern }, id: { eq: id } } : { name: { ilike: searchPattern } };
      const response = await executeGraphQLBackend(GET_COUNTRIES, { filter, limit: pageSize, offset });
      return response.zoho_countriesCollection.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error getting countries:', error);
      throw error;
    }
  }
};
