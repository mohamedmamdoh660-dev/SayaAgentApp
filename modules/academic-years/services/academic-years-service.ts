import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  CREATE_ACADEMIC_YEAR,
  DELETE_ACADEMIC_YEAR,
  GET_ACADEMIC_YEARS,
  GET_ACADEMIC_YEAR_BY_ID,
  UPDATE_ACADEMIC_YEAR,
} from "./academic-years-graphql";
import { getTableCount } from "@/supabase/actions/db-actions";
import { ZohoAcademicYear } from "@/types/types";

class AcademicYearsService {
  // Get academic years with pagination, search, and sorting
  async getAcademicYears({
    page = 0,
    pageSize = 10,
    searchQuery = "",
    orderBy = [{ created_at: "desc" }],
  }: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    orderBy?: any[];
  }) {
    try {
      const offset = page * pageSize;
      const searchPattern = `%${searchQuery}%`;
      const filter = { name: { ilike: searchPattern } };

      const response = await executeGraphQLBackend(GET_ACADEMIC_YEARS, {
        filter,
        limit: pageSize,
        offset,
        orderBy
      });

      // Get total count via RPC
      const raw = searchQuery || "";
      const term = raw.replace(/^%|%$/g, "");
      const totalCount = await getTableCount('zoho_academic_years', { name: term });

      return {
        academicYears: response.zoho_academic_yearsCollection.edges.map((edge: any) => edge.node),
        totalCount
      };
    } catch (error) {
      console.error("Error fetching academic years:", error);
      throw error;
    }
  }

  // Get a single academic year by ID
  async getAcademicYearById(id: string) {
    try {
      const response = await executeGraphQLBackend(GET_ACADEMIC_YEAR_BY_ID, { id });
      return response.zoho_academic_yearsCollection.edges[0]?.node || null;
    } catch (error) {
      console.error(`Error fetching academic year with ID ${id}:`, error);
      throw error;
    }
  }

  // Create a new academic year
  async createAcademicYear(academicYearData: Partial<ZohoAcademicYear>) {
    try {
      const response = await executeGraphQLBackend(CREATE_ACADEMIC_YEAR, {
        objects: [academicYearData]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_academic_yearsCollection.records[0];
    } catch (error) {
      console.error("Error creating academic year:", error);
      throw error;
    }
  }

  // Update an existing academic year
  async updateAcademicYear(id: string, academicYearData: Partial<ZohoAcademicYear>) {
    try {
      const response = await executeGraphQLBackend(UPDATE_ACADEMIC_YEAR, {
        id,
        ...academicYearData
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_academic_yearsCollection.records[0];
    } catch (error) {
      console.error(`Error updating academic year with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete an academic year
  async deleteAcademicYear(id: string) {
    try {
      const response = await executeGraphQLBackend(DELETE_ACADEMIC_YEAR, { id });
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      return response.deleteFromzoho_academic_yearsCollection.records[0];
    } catch (error) {
      console.error(`Error deleting academic year with ID ${id}:`, error);
      throw error;
    }
  }

  // Toggle academic year active status
  async toggleAcademicYearStatus(id: string, active: boolean) {
    try {
      const response = await executeGraphQLBackend(UPDATE_ACADEMIC_YEAR, {
        id,
        active
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_academic_yearsCollection.records[0];
    } catch (error) {
      console.error(`Error toggling academic year status with ID ${id}:`, error);
      throw error;
    }
  }
}

export const academicYearsService = new AcademicYearsService();