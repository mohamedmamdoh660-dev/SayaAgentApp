'use server';

import { supabase } from "@/lib/supabase-auth-client";

  /**
   * Get admin dashboard statistics
   */
  export async function getAdminDashboardStats() {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    
    if (error) {
      console.error("Error:", error);
    } else {
      return data;
    }
  }

  /**
   * Get application funnel data
   */
  export async function getApplicationFunnel() {
    try {
      const { data, error } = await supabase.rpc('get_application_funnel');

      if (error) throw error;

      const rows: Array<{ name: string; value: number; percentage: number }> = Array.isArray((data as any)?.get_application_funnel)
        ? (data as any).get_application_funnel
        : (Array.isArray(data) ? (data as any) : []);

      return rows || [];
    } catch (error) {
      console.error("Error fetching application funnel data:", error);
      throw error;
    }
  }

  /**
   * Get best programs data
   */
  export async function getBestPrograms(filters: { degree?: string, university?: string, stage?: string } = {}) {
    try {
      let query = supabase
        .from('zoho_applications')
        .select(`
          zoho_programs (
            id,
            name,
            degree_id
          ),
          zoho_universities (
            id,
            name
          ),
          stage
        `);
      
      // Apply filters if provided
      if (filters.degree && filters.degree !== 'All') {
        query = query.eq('zoho_programs.degree_id', filters.degree);
      }
      
      if (filters.university && filters.university !== 'All') {
        query = query.eq('zoho_universities.name', filters.university);
      }
      
      if (filters.stage && filters.stage !== 'All') {
        query = query.eq('stage', filters.stage.toLowerCase());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Count applications per program
      const programCounts = data.reduce((acc: Record<string, any>, item: any) => {
        const programName = item.zoho_programs?.name || 'Unknown Program';
        const programId = item.zoho_programs?.id || 'unknown';
        
        if (!acc[programId]) {
          acc[programId] = {
            name: programName,
            applications: 0,
            degree: item.zoho_programs?.degree_id || 'Unknown'
          };
        }
        
        acc[programId].applications++;
        return acc;
      }, {});
      
      // Transform to array for chart and sort by applications count
      const chartData = Object.values(programCounts)
        .sort((a: any, b: any) => b.applications - a.applications)
        .slice(0, 20); // Limit to top 10
      
      return chartData;
    } catch (error) {
      console.error("Error fetching best programs data:", error);
      throw error;
    }
  }
