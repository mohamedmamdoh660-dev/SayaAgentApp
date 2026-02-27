import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  CREATE_UNIVERSITY,
  DELETE_UNIVERSITY,
  GET_CITIES_BY_COUNTRY,
  GET_COUNTRIES,
  GET_UNIVERSITIES,
  GET_UNIVERSITY_BY_ID,
  UPDATE_UNIVERSITY,
} from "./universities-graphql";
import { ZohoUniversity } from "@/types/types";
import { getTableCount } from "@/supabase/actions/db-actions";

class UniversitiesService {
  // Get universities with pagination, search, and sorting
  async getUniversities({
    page = 0,
    pageSize = 10,
    searchQuery = "",
    orderBy = { sortBy: "created_at", sortOrder: "desc" },
  }: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    orderBy?: {
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    };
  }) {
    try {
      const offset = page * pageSize;
      const searchPattern = `%${searchQuery}%`;
      const filter = { name: { ilike: searchPattern } };

      const response = await executeGraphQLBackend(GET_UNIVERSITIES, {
        filter,
        limit: pageSize,
        offset,
        orderBy: Object.keys(orderBy || {}).length > 0 ? { [orderBy?.sortBy || 'created_at']: orderBy.sortOrder === "asc" ? 'AscNullsLast' : 'DescNullsLast' } : { name: 'AscNullsLast' }
      });

      // Get total count via RPC
      const raw = searchQuery || "";
      const term = raw.replace(/^%|%$/g, "");
      const totalCount = await getTableCount('zoho_universities', { name: term });

      return {
        universities: response.zoho_universitiesCollection.edges.map((edge: any) => edge.node),
        totalCount
      };
    } catch (error) {
      console.error("Error fetching universities:", error);
      throw error;
    }
  }

  // Get a single university by ID
  async getUniversityById(id: string) {
    try {
      const response = await executeGraphQLBackend(GET_UNIVERSITY_BY_ID, { id });
      return response.zoho_universitiesCollection.edges[0]?.node || null;
    } catch (error) {
      console.error(`Error fetching university with ID ${id}:`, error);
      throw error;
    }
  }

  // Get all countries
  async getCountries() {
    try {
      const response = await executeGraphQLBackend(GET_COUNTRIES, {
        limit: 100, // Fetch a reasonable number of countries
      });
      return response.zoho_countriesCollection.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error("Error fetching countries:", error);
      throw error;
    }
  }

  // Get cities by country
  async getCitiesByCountry(countryId: string) {
    try {
      const response = await executeGraphQLBackend(GET_CITIES_BY_COUNTRY, { 
        countryId: parseInt(countryId)
      });
      return response.zoho_citiesCollection.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error(`Error fetching cities for country ${countryId}:`, error);
      throw error;
    }
  }

  // Create a new university
  async createUniversity(universityData: Partial<ZohoUniversity>) {
    try {
      const response = await executeGraphQLBackend(CREATE_UNIVERSITY, {
        objects: [universityData]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_universitiesCollection.records[0];
    } catch (error) {
      console.error("Error creating university:", error);
      throw error;
    }
  }

  // Update an existing university
  async updateUniversity(id: string, universityData: Partial<ZohoUniversity>) {
    try {
      const response = await executeGraphQLBackend(UPDATE_UNIVERSITY, {
        id,
        ...universityData
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_universitiesCollection.records[0];
    } catch (error) {
      console.error(`Error updating university with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete a university
  async deleteUniversity(id: string) {
    try {
      const response = await executeGraphQLBackend(DELETE_UNIVERSITY, { id });
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      return response.deleteFromzoho_universitiesCollection.records[0];
    } catch (error) {
      console.error(`Error deleting university with ID ${id}:`, error);
      throw error;
    }
  }
}

export const universitiesService = new UniversitiesService();