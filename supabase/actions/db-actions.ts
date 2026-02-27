"use server";

import { supabase, supabaseClient } from "@/lib/supabase-auth-client";

export const getStudentById = async (id: string) => {
    const { data, error } = await supabase
    .from("zoho_students")
    .select(`
      *,
      nationality_record:zoho_countries!zoho_students_nationality_fkey (id, name),
      address_country_record:zoho_countries!zoho_students_address_country_fkey (id, name),
      academic_level_record:zoho_degrees!zoho_students_education_level_fkey (id, name)
    `)
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getApplicationById = async (id: string) => {
  const { data, error } = await supabase
    .from("zoho_applications")
    .select("*, user:user_profile!zoho_applications_agency_id_fkey (first_name, last_name, email), added_user:user_profile!zoho_applications_user_id_fkey (first_name, last_name, email), zoho_programs:zoho_programs!applications_program_fkey (name), zoho_academic_years:zoho_academic_years!zoho_applications_acdamic_year_fkey (name), zoho_semesters:zoho_semesters!zoho_applications_semester_fkey (name), zoho_countries:zoho_countries!applications_country_fkey (name), zoho_universities:zoho_universities!zoho_applications_university_fkey (*,zoho_countries:zoho_countries!zoho_universities_country_fkey (name), zoho_cities:zoho_cities!zoho_universities_city_fkey (name)), zoho_degrees:zoho_degrees!zoho_applications_degree_fkey (name), zoho_students:zoho_students!applications_student_fkey (id,first_name, gender, last_name, email, mobile, nationality, passport_number, passport_issue_date, passport_expiry_date, photo_url,address_country_record:zoho_countries!zoho_students_address_country_fkey (name), country_of_residence, nationality_record:zoho_countries!zoho_students_nationality_fkey (name))")
    
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const getApplicationsPagination = async (
  search: string,
  limit: number,
  offset: number,
  user_id: string,
  userRole: string,
  agency_id: string,
  filters: {
    student?: string | null;
    program?: string | null;
    acdamic_year?: string | null;
    semester?: string | null;
    country?: string | null;
    university?: string | null;
    degree?: string | null;
    stage?: string | null;
  } = {},
  sorting?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  recordPermission: boolean = false
) => {
 
    try {
      let programIds = [];
      let studentIds = [];
      const searchPattern = `%${search.trim()}%`;
      // If search is provided, get matching IDs first
      if (search && search.trim() !== "") {
        // Get matching program IDs  
        const { data: programs } = await supabaseClient
          .from("zoho_programs")
          .select("id")
          .ilike("name", searchPattern);
        
        programIds = programs?.map(p => p.id) || [];

        const { data: students } = await supabaseClient
          .from("zoho_students")
          .select("id")
       .or(`email.ilike.${searchPattern},passport_number.ilike.${searchPattern}`);
         

        studentIds = students?.map(s => s.id) || [];
      }
  
      // Main query
      let query = supabaseClient
        .from("zoho_applications")
        .select(
          `
          id,
          created_at,
          updated_at,
          student,
          program,
          acdamic_year,
          semester,
          country,
          university,
          stage,
          degree,
          application_name,
          online_application_id,
          app_id,
  
          agent:user_profile!zoho_applications_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            profile
          ),
  
          zoho_students (
            id,
            first_name,
            last_name,
            email,
            mobile,
            passport_number,
            photo_url
          ),
  
          zoho_programs (
            id,
            name
          ),
  
          zoho_academic_years (
            id,
            name,
            active
          ),
  
          zoho_semesters (
            id,
            name,
            active
          ),
  
          zoho_countries (
            id,
            name,
            country_code
          ),
  
          zoho_universities (
            id,
            name,
            logo,
            sector
          ),
  
          zoho_degrees (
            id,
            name,
            code
          )
        `,
          { count: "exact" }
        );
  
      // Role-based filtering
      if (userRole === "admin" || recordPermission) {
      } else if (userRole === "agent") {
        query = query.eq("agency_id", user_id);
      } else {
        query = query.eq("user_id", user_id);
      }
  
      // Apply search filter using IN clause and text fields
      if (search && search.trim() !== "") {
        const orConditions = [];
        const trimmedSearch = search.trim();
        const searchPattern = `%${trimmedSearch}%`;
        
        if (programIds.length > 0) {
          orConditions.push(`program.in.(${programIds.join(',')})`);
        }

        if (studentIds.length > 0) {
          orConditions.push(`student.in.(${studentIds.join(',')})`);
        }

        // Application fields
        orConditions.push(`application_name.ilike.${searchPattern}`);
        orConditions.push(`online_application_id.ilike.${searchPattern}`);
        orConditions.push(`app_id.ilike.${searchPattern}`);
        orConditions.push(`stage.ilike.${searchPattern}`);
          orConditions.push(`id.eq.${trimmedSearch}`);
        
        
       
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','));
        }
      }
  
      // Apply advanced filters
      if (filters) {
        if (filters.student) {
          query = query.eq("student", filters.student);
        }
        if (filters.program) {
          query = query.eq("program", filters.program);
        }
        if (filters.acdamic_year) {
          query = query.eq("acdamic_year", filters.acdamic_year);
        }
        if (filters.semester) {
          query = query.eq("semester", filters.semester);
        }
        if (filters.country) {
          query = query.eq("country", filters.country);
        }
        if (filters.university) {
          query = query.eq("university", filters.university);
        }
        if (filters.degree) {
          query = query.eq("degree", filters.degree);
        }
        if (filters.stage) {
          query = query.ilike("stage", `%${filters.stage}%`);
        }
      }

      // Apply sorting and pagination
      const sortBy = sorting?.sortBy || "created_at";
      const sortOrder = sorting?.sortOrder || "desc";
      
      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(offset * limit,limit * (offset + 1) - 1);
  
      if (error) throw error;
  
      return {
        applications: data || [],
        totalCount: count || 0,
      };
    } catch (err) {
      console.error("Error fetching applications:", err);
      throw err;
    }
  
  
  
  
};



export const getStudentsPagination = async (    search: string,
  limit: number,
  offset: number,
  // filter: any = {}, // equivalent to zoho_studentsFilter
  user_id: string,
  userRole: string,
  agency_id: string,
  sorting?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  recordPermission: boolean = false
) => {
 
    
      try {
        // Build the base query with all the fields and relationships
        let query = supabaseClient
          .from("zoho_students")
          .select(
            `
            id,
            created_at,
            updated_at,
            first_name,
            last_name,
            gender,
            date_of_birth,
            nationality,
            passport_number,
            passport_issue_date,
            passport_expiry_date,
            country_of_residence,
            email,
            mobile,
            father_name,
            father_mobile,
            father_job,
            mother_name,
            mother_mobile,
            mother_job,
      photo_url,            
            agent:user_profile!zoho_students_user_id_fkey (
              first_name,
              last_name,
              email,
              profile
            ),
            
        nationality_record:zoho_countries!zoho_students_nationality_fkey (
          id,
          name
        )
       
            
         
            `,
            { count: "exact" }
          );
    
        // Apply search filter if provided
        if (search && search.trim() !== "") {
          const searchPattern = `%${search.trim()}%`;
          query = query.or(`
            first_name.ilike.${searchPattern},
            last_name.ilike.${searchPattern},
            email.ilike.${searchPattern},
            mobile.ilike.${searchPattern},
            passport_number.ilike.${searchPattern}
          `.replace(/\s+/g, ''));
        }
    
    
        // Role-based filtering (if needed)
        if (userRole === "admin" || recordPermission) {
        } else if (userRole === "agent") {
          query = query.eq("agency_id", user_id);
        } else {
          query = query.eq("user_id", user_id);
        }
    
        // Apply ordering and pagination
        const sortBy = sorting?.sortBy || "created_at";
        const sortOrder = sorting?.sortOrder || "desc";
        const { data, error, count } = await query
          .order(sortBy, { ascending: sortOrder === "asc" })
          .range(offset * limit,limit * (offset + 1) - 1);
    
        if (error) throw error;
    
        // Format the response to match GraphQL structure
        const students = data ;
    
        return {
          students,
          totalCount: count || 0,
          pageInfo: {
            hasNextPage: (offset + limit) < (count || 0),
            hasPreviousPage: offset > 0,
          }
        };
      } catch (err) {
        console.error("Error fetching students:", err);
        throw err;
      }
    

  }

  export const getProgramsPagination = async (
    search: string,
    limit: number,
    offset: number,
    filters: Record<string, string> = {},
    sorting: { sortBy?: string, sortOrder?: "asc" | "desc" } = {}
  ) => {
    
    // Clean up search - don't send %% if empty
    const cleanSearch = search && search.trim() && search !== "%%" ? search.trim() : null;
    
    const { data, error } = await supabaseClient.rpc('get_programs_pagination', {
      p_search: cleanSearch,
      p_limit: limit,
      p_offset: offset,
      p_university_id: filters.university || null,
      p_faculty_id: filters.faculty || null,
      p_speciality_id: filters.speciality || null,
      p_degree_id: filters.degree || null,
      p_country_id: filters.country || null,
      p_city_id: filters.city || null,
      p_language_id: filters.language || null,
      p_min_tuition: filters.minTuition ? parseInt(filters.minTuition) : 0,
      p_max_tuition: filters.maxTuition ? parseInt(filters.maxTuition) : null,
      p_active_applications: !filters.active ? null : filters.active === 'true' ? true : filters.active === 'false' ? false : true,
      p_sort_by: sorting?.sortBy || 'created_at',
      p_sort_order: sorting?.sortOrder || 'desc',
    });
  
    if (error) {
      console.error("❌ RPC Error:", error);
      throw error;
    }
  
  
    // Get total count from first row (all rows have same total_count)
    const totalCount = data && data.length > 0 ? data[0].total_count : 0;
  
    // Transform data to match your expected structure
    const programs = data?.map((row: any) => ({
      id: row.id,
      name: row.name,
      official_tuition: row.official_tuition,
      discounted_tuition: row.discounted_tuition,
      official_tuition_int: row.official_tuition_int,
      university_id: row.university_id,
      faculty_id: row.faculty_id,
      speciality_id: row.speciality_id,
      degree_id: row.degree_id,
      country_id: row.country_id,
      city_id: row.city_id,
      language_id: row.language_id,
      active_applications: row.active_applications,
      active: row.active,
      tuition_fee_usd: row.tuition_fee_usd,
      tuition_currency: row.tuition_currency,
      created_at: row.created_at,
      updated_at: row.updated_at,
      zoho_countries: row.country_name ? {
        id: row.country_id,
        name: row.country_name,
        country_code: row.country_code
      } : null,
      zoho_degrees: row.degree_name ? {
        id: row.degree_id,
        name: row.degree_name
      } : null,
      zoho_faculty: row.faculty_name ? {
        id: row.faculty_id,
        name: row.faculty_name
      } : null,
      zoho_languages: row.language_name ? {
        id: row.language_id,
        name: row.language_name
      } : null,
      zoho_speciality: row.speciality_name ? {
        id: row.speciality_id,
        name: row.speciality_name
      } : null,
      zoho_cities: row.city_name ? {
        id: row.city_id,
        name: row.city_name
      } : null,
      zoho_universities: row.university_name ? {
        id: row.university_id,
        name: row.university_name,
        sector: row.university_sector,
        logo: row.university_logo
      } : null
    }));
  
    return {
      programs: programs || [],
      totalCount: totalCount
    };
  }

  export const getProgramsAll = async (
    search: string,
    user_id: string,
    userRole: string,
    agency_id: string,
    filters: Record<string, string> = {},
    sorting: { sortBy?: string; sortOrder?: "asc" | "desc" } = {}
  ) => {
    let query = supabaseClient
      .from('zoho_programs')
      .select(`
        *,
        zoho_countries ( id, name, country_code ),
        zoho_degrees ( id, name ),
        zoho_faculty ( id, name ),
        zoho_languages ( id, name ),
        zoho_speciality ( id, name ),
        zoho_cities ( id, name ),
        zoho_universities ( id, name, sector, logo )
      `, { count: 'exact' });

    if (search && search.trim() !== "") {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    if (filters.university) query = query.eq('university_id', filters.university);
    if (filters.faculty) query = query.eq('faculty_id', filters.faculty);
    if (filters.speciality) query = query.eq('speciality_id', filters.speciality);
    if (filters.degree) query = query.eq('degree_id', filters.degree);
    if (filters.country) query = query.eq('country_id', filters.country);
    if (filters.city) query = query.eq('city_id', filters.city);
    if (filters.language) query = query.eq('language_id', filters.language);

    if (filters.active === 'true' || filters.active === 'false') {
      query = query.eq('active', filters.active === 'true');
    } else {
      query = query.eq('active', true);
    }

    if (filters.active_applications === 'open' || filters.active_applications === 'closed') {
      query = query.eq('active_applications', filters.active_applications === 'open');
    }

    const { data, error,count } = await query.order(
      sorting?.sortBy || 'created_at',
      { ascending: sorting?.sortOrder === 'asc' }
    )  .range(0, 9999); // fetch up to 10,000 rows
    ;
    if (error) throw error;
    return data || [];
  }

  export const markApplicationNotesAsRead = async (application_id: string) => {
    const { data, error } = await supabaseClient
      .from('zoho_application_notes')
      .update({ is_read: true })
      .eq('application_id', application_id);
    if (error) throw error;
    return data;
  }

  export const markNotificationsAsRead = async (agent_id: string) => {
    const { data, error } = await supabaseClient
      .from('zoho_notifications')
      .update({ is_read: true })
      .eq('user_id', agent_id);
    if (error) throw error;
    return data;
  }

// RPC-based generic table count helper using get_table_count(table_name, search_json)
export const getTableCount = async (
  tableName: string,
  searchObject: Record<string, string>
): Promise<number> => {
  const { data, error } = await supabaseClient.rpc('get_table_count', {
    table_name: tableName,
    search_filters: searchObject,
  });
  if (error) throw error;
  return (data as number) || 0;
};


export const getApplicationsByProgramId = async (id: string, userRole?: string, user_id?: string) => {
  // If userRole/permissions are provided, restrict applications by user/agency, otherwise return all by program
  let query = supabaseClient
    .from("zoho_applications")
    .select(
      `id, application_name, stage, created_at,
       zoho_students:zoho_students!applications_student_fkey (id, first_name, last_name, email, photo_url),
       zoho_universities:zoho_universities!zoho_applications_university_fkey (name),
       zoho_academic_years:zoho_academic_years!zoho_applications_acdamic_year_fkey (name),
       zoho_semesters:zoho_semesters!zoho_applications_semester_fkey (name)`
    )
    .eq("program", id);

  // Add permission-based filtering if role/user_id is passed
  if (userRole && user_id) {
    if (userRole === "admin") {
      // Admins or those with recordPermission can access all
    } else if (userRole === "agent") {
      query = query.eq("agency_id", user_id);
    } else {
      query = query.eq("user_id", user_id);
    }
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};