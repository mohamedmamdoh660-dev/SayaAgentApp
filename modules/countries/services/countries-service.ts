import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  CREATE_COUNTRY,
  DELETE_COUNTRY,
  GET_COUNTRIES,
  GET_COUNTRY_BY_ID,
  UPDATE_COUNTRY,
} from "./countries-graphql";
import { ZohoCountry } from "@/types/types";
import { getTableCount } from "@/supabase/actions/db-actions";

class CountriesService {
  // Get countries with pagination, search, and sorting
  async getCountries({
    page = 0,
    pageSize = 10,
    searchQuery = "",
    orderBy = [{ name: "asc" }],
  }: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    orderBy?: any[];
  }) {
    try {
      const offset = page * pageSize;
      const searchPattern = `%${searchQuery}%`;
      const filter = {
        or: [
          { name: { ilike: searchPattern } },
          { country_code: { ilike: searchPattern } }
        ]
      };

      const response = await executeGraphQLBackend(GET_COUNTRIES, {
        filter,
        limit: pageSize,
        offset,
        orderBy
      });

      // Get total count via RPC
      const raw = searchQuery || "";
      const term = raw.replace(/^%|%$/g, "");
      const totalCount = await getTableCount('zoho_countries', { name: term, country_code: term });

      return {
        countries: response.zoho_countriesCollection.edges.map((edge: any) => edge.node),
        totalCount
      };
    } catch (error) {
      console.error("Error fetching countries:", error);
      throw error;
    }
  }

  // Get a single country by ID
  async getCountryById(id: string) {
    try {
      const response = await executeGraphQLBackend(GET_COUNTRY_BY_ID, { id });
      return response.zoho_countriesCollection.edges[0]?.node || null;
    } catch (error) {
      console.error(`Error fetching country with ID ${id}:`, error);
      throw error;
    }
  }

  // Create a new country
  async createCountry(countryData: Partial<ZohoCountry>) {
    try {
      const response = await executeGraphQLBackend(CREATE_COUNTRY, {
        objects: [countryData]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_countriesCollection.records[0];
    } catch (error) {
      console.error("Error creating country:", error);
      throw error;
    }
  }

  // Update an existing country
  async updateCountry(id: string, countryData: Partial<ZohoCountry>) {
    try {
      const response = await executeGraphQLBackend(UPDATE_COUNTRY, {
        id,
        ...countryData
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_countriesCollection.records[0];
    } catch (error) {
      console.error(`Error updating country with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete a country
  async deleteCountry(id: string) {
    try {
      const response = await executeGraphQLBackend(DELETE_COUNTRY, { id });
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      return response.deleteFromzoho_countriesCollection.records[0];
    } catch (error) {
      console.error(`Error deleting country with ID ${id}:`, error);
      throw error;
    }
  }

  // Toggle country active status for nationalities
  async toggleCountryNationalitiesStatus(id: string, active: boolean) {
    try {
      const response = await executeGraphQLBackend(UPDATE_COUNTRY, {
        id,
        active_on_nationalities: active
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_countriesCollection.records[0];
    } catch (error) {
      console.error(`Error toggling country nationalities status with ID ${id}:`, error);
      throw error;
    }
  }

  // Toggle country active status for universities
  async toggleCountryUniversityStatus(id: string, active: boolean) {
    try {
      const response = await executeGraphQLBackend(UPDATE_COUNTRY, {
        id,
        active_on_university: active
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_countriesCollection.records[0];
    } catch (error) {
      console.error(`Error toggling country university status with ID ${id}:`, error);
      throw error;
    }
  }
}

export const countriesService = new CountriesService();