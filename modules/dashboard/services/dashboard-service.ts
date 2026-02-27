'use server';

import { supabase } from "@/lib/supabase-auth-client";

export async function getDashboardStats(role: string | undefined, agencyId: string | undefined, userId: string | undefined) {
    try {
      const { data, error } = await supabase
      .rpc('get_dashboard_stats', {
        p_role: role,          // 'admin' | 'agency' | 'agent'
        p_agency_id: agencyId, // required if role = 'agency'
        p_user_id: userId      // required if role = 'agent'
      });

    if (error) {
      console.error(error);
      throw error;
    } else {
            // { totalStudents, totalApplications, totalUniversities, successRate }

      return data;

    }
    
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get application stages count
   */
  export async function getApplicationStagesCount() {
    try {
      // Get pending applications count
      const { count: pending, error: pendingError } = await supabase
        .from('zoho_applications')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'pending');

      if (pendingError) throw pendingError;

      // Get processing applications count
      const { count: processing, error: processingError } = await supabase
        .from('zoho_applications')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'processing');

      if (processingError) throw processingError;

      // Get completed applications count
      const { count: completed, error: completedError } = await supabase
        .from('zoho_applications')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'completed');

      if (completedError) throw completedError;

      // Get failed applications count
      const { count: failed, error: failedError } = await supabase
        .from('zoho_applications')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'failed');

      if (failedError) throw failedError;

      return {
        pending: pending || 0,
        processing: processing || 0,
        completed: completed || 0,
        failed: failed || 0
      };
    } catch (error) {
      console.error("Error fetching application stages count:", error);
      throw error;
    }
  }

  /**
   * Get university distribution
   */
  export async function getUniversityDistribution(userId: string | undefined, agencyId: string | undefined, role: string | undefined) {
   
    try {
      const { data, error } = await supabase.rpc('get_university_applications', {
        p_user_id: userId,
        p_role: role,
      });

      if (error) throw error;

      const rows: Array<{ university: string; applications: number }> = Array.isArray((data as any)?.get_university_applications)
        ? (data as any).get_university_applications
        : (Array.isArray(data) ? (data as any) : []);

      const chartData = (rows || []).map((r: any, index: number) => ({
        university: r.university,
        applications: r.applications,
        fill: `var(--chart-${(index % 5) + 1})`
      }));

      return chartData;
    } catch (error) {
      console.error("Error fetching university distribution:", error);
      throw error;
    }
  }

  /**
   * Get gender distribution
   */
  export async function getGenderDistribution(userId: string | undefined, agencyId: string | undefined, role: string | undefined) {
    try {
      // Get students grouped by gender
      const query =  supabase
        .from('zoho_students')
        .select('gender')
        .not('gender', 'is', null);

        if (role === 'admin') {
        } else if (role === 'agent') {
         query.eq('agency_id', userId);
      } else {
        query.eq('user_id', userId);
      }


      const { data, error } = await query;

      if (error) throw error;

      // Count students per gender
      const genderCounts = data?.reduce((acc: Record<string, any>, item: any) => {
        const gender = item.gender.charAt(0).toUpperCase() + item.gender.slice(1);
        
        if (!acc[gender]) {
          acc[gender] = {
            gender,
            students: 0
          };
        }
        
        acc[gender].students++;
        return acc;
      }, {});

      // Transform to array for chart
      const chartData = Object.values(genderCounts || {}).map((item: any, index: number) => ({
        ...item,
        fill: `var(--chart-${(index % 5) + 1})`
      }));

      return chartData;
    } catch (error) {
      console.error("Error fetching gender distribution:", error);
      throw error;
    }
  }

  /**
   * Get recent applications
   */
  export async function getRecentApplications(limit = 10, userId: string | undefined, agencyId: string | undefined, role: string | undefined) {
    try {
      const query = supabase
        .from('zoho_applications')
        .select(`
          id,
          created_at,
          updated_at,
          stage,
          zoho_students (
            id,
            first_name,
            last_name,
            email,
            photo_url
          ),
          zoho_programs (
            id,
            name
          ),
          zoho_universities (
            id,
            name,
            logo
          ),
          zoho_academic_years (
            id,
            name
          ),
          zoho_semesters (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

        if (role === 'admin') {
        } else if (role === 'agent') {
         query.eq('agency_id', userId);
      } else {
        query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching recent applications:", error);
      throw error;
    }
  }

  /**
   * Get all available application stages
   */
  export async function getApplicationStages(userId?: string, agencyId?: string, role?: string) {
    try {
      const query = supabase
        .from('zoho_applications')
        .select('stage')
        .not('stage', 'is', null);

      // Apply role-based filtering if needed
      if (role === 'admin') {
      } else if (role === 'agent') {
        query.eq('agency_id', userId);
      } else{
        query.eq('user_id', userId);
      }

      const { data, error } = await query.order('stage');
      
      if (error) throw error;
      
      // Extract unique stages and preserve original casing
      const uniqueStages = Array.from(
        new Set(data.map((item: any) => item.stage?.toLowerCase()).filter(Boolean))
      );
      
      
      return uniqueStages;
    } catch (error) {
      console.error("Error fetching application stages:", error);
      throw error;
    }
  }

  /**
   * Get application timeline data
   */
  export async function getApplicationTimeline(days = 30, userId: string | undefined, agencyId: string | undefined, role: string | undefined) {
    try {
      // Use SQL function to fetch timeline data
      const { data, error } = await supabase.rpc('get_application_timeline', {
        p_days: days,
        p_user_id: userId,
        p_role: role,
      });

      if (error) throw error;

      const records: Array<{ date: string; stages: Record<string, number> }> = Array.isArray(data.get_application_timeline) ? (data.get_application_timeline as any) : [];

      if (!records || records.length === 0) {
        return { data: [], stages: [] };
      }

      // Collect union of all stages (lowercased for consistency)
      const stagesSet = new Set<string>();
      records.forEach((r) => {
        Object.keys(r.stages || {}).forEach((key) => stagesSet.add(key.toLowerCase()));
      });

      const stages = Array.from(stagesSet);

      // Transform into chart-friendly shape: { date, [stage]: count, ... }
      const chartData = records.map((r) => {
        const entry: Record<string, any> = { date: r.date };
        // Initialize all stages to 0 to keep consistent keys across dates
        stages.forEach((s) => {
          entry[s] = 0;
        });
        // Fill with actual values from this record
        Object.entries(r.stages || {}).forEach(([key, value]) => {
          entry[key.toLowerCase()] = value as number;
        });
        return entry;
      });

      return { data: chartData, stages };
    } catch (error) {
      console.error("Error fetching application timeline:", error);
      throw error;
    }
  }



