import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  ANNOUNCEMENTS_SUBSCRIPTION,
  ANNOUNCEMENT_BY_ID_SUBSCRIPTION,
  CREATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
  GET_ANNOUNCEMENT_BY_ID,
  GET_ANNOUNCEMENTS,
  UPDATE_ANNOUNCEMENT,
} from "./announcements-graphql";
import { ZohoAnnouncement } from "@/types/types";
import { supabaseClient } from "@/lib/supabase-auth-client";

class AnnouncementsService {
  // Get announcements with pagination, search, and filtering
  async getAnnouncements({
    page = 0,
    pageSize = 10,
    searchQuery = "",
    orderBy = [{ created_at: "desc" }],
    category = null,
    university = null,
    program = null,
  }: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    orderBy?: any[];
    category?: string | null;
    university?: string | null;
    program?: string | null;
  }) {
    try {
      const offset = page * pageSize;
      const searchPattern = `%${searchQuery}%`;
      
      const filter: any = {
        or: [
          { title: { ilike: searchPattern } },
          { description: { ilike: searchPattern } }
        ]
      };
      
      if (category) {
        filter.category = { eq: category };
      }
      
      if (university) {
        filter.university = { eq: parseInt(university) };
      }
      
      if (program) {
        filter.program = { eq: parseInt(program) };
      }

      const response = await executeGraphQLBackend(GET_ANNOUNCEMENTS, {
        filter,
        limit: pageSize,
        offset,
        orderBy
      });

      // Get total count
      const countResponse = await supabaseClient
        .from('zoho_announcements')
        .select('id', { count: 'exact' })
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`);

      return {
        announcements: response.zoho_announcementsCollection.edges.map((edge: any) => edge.node),
        totalCount: countResponse.count || 0
      };
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error;
    }
  }

  // Get a single announcement by ID
  async getAnnouncementById(id: string) {
    try {
      const response = await executeGraphQLBackend(GET_ANNOUNCEMENT_BY_ID, { id });
      return response.zoho_announcementsCollection.edges[0]?.node || null;
    } catch (error) {
      console.error(`Error fetching announcement with ID ${id}:`, error);
      throw error;
    }
  }

  // Create a new announcement
  async createAnnouncement(announcementData: Partial<ZohoAnnouncement>) {
    try {
      const response = await executeGraphQLBackend(CREATE_ANNOUNCEMENT, {
        objects: [announcementData]
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.insertIntozoho_announcementsCollection.records[0];
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  }

  // Update an existing announcement
  async updateAnnouncement(id: string, announcementData: Partial<ZohoAnnouncement>) {
    try {
      const response = await executeGraphQLBackend(UPDATE_ANNOUNCEMENT, {
        id,
        ...announcementData
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.updatezoho_announcementsCollection.records[0];
    } catch (error) {
      console.error(`Error updating announcement with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete an announcement
  async deleteAnnouncement(id: string) {
    try {
      const response = await executeGraphQLBackend(DELETE_ANNOUNCEMENT, { id });
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      return response.deleteFromzoho_announcementsCollection.records[0];
    } catch (error) {
      console.error(`Error deleting announcement with ID ${id}:`, error);
      throw error;
    }
  }

  // Subscribe to announcements for real-time updates
  subscribeToAnnouncements() {
    return supabaseClient
      .channel('announcements-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'zoho_announcements' 
        }, 
        (payload) => {
          return payload;
        }
      )
      .subscribe();
  }

  // Subscribe to a specific announcement for real-time updates
  subscribeToAnnouncementById(id: string) {
    return supabaseClient
      .channel(`announcement-${id}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'zoho_announcements',
          filter: `id=eq.${id}`
        }, 
        (payload) => {
          return payload;
        }
      )
      .subscribe();
  }
}

export const announcementsService = new AnnouncementsService();