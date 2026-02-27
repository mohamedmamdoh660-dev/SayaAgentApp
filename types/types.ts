
export interface User {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  role_id?: string
  project_id?: string
  is_active?: boolean
  last_login?: string
  created_at?: string
  crm_id?: string
 
  updated_at?: string
  profile?: string
  status?: string
  agency?: {
    crm_id?: string
    settings: {
      edges: {
        node: {
          site_name: string
          logo_url: string
        }
      }[]
    }
  }
  settings?: {
    edges: {
      node: {
        site_name: string
        logo_url: string
      }
    }[]
  }
  agency_id?: string
  roles?: {
    name: string
    description?: string
    role_accessCollection?: {
      edges: Array<{
        node: {
          resource: string
          action: string
        }
      }>
    }
  }
  
 
} 


export interface MenuItem {
  title: string;
  url: string;
  icon?: any;
  isActive?: boolean;
  resource?: ResourceType;
  unreadCount?: number;
  items?: MenuItem[];
}

export interface MenuSection {
  title: string;
  url: string;
  items: MenuItem[];
}

export enum UserRoles {
  ADMIN = "admin",
  AGENT = "agent",
  SUB_AGENT = "sub agent"
}


export interface ZohoAcademicYear {
  id: string;
  name?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: User
}


export interface ZohoAnnouncement {
  id: string;
  title?: string;
  category?: string;
  description?: string;
  university?: string | null;
  program?: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Related entities
  zoho_universities?: ZohoUniversity;
  zoho_programs?: ZohoProgram;
}

export type AnnouncementCategory = "General" | "Admission" | "Academic" | "Event" | "Other";

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  "General",
  "Admission",
  "Academic",
  "Event",
  "Other"
];


export interface ZohoCountry {
  id: string;
  name: string;
  country_code?: string;
  active_on_nationalities?: boolean;
  active_on_university?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: User

}
export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoleAccess {
  id: string;
  role_id: string;
  resource: ResourceType;
  action: ActionType;
  created_at?: string;
  updated_at?: string;
  roles: Role;
}

export enum ResourceType {
  // Core
  DASHBOARD = "dashboard",
  
  // User Management
  USERS = "users",
  ROLES = "roles",
  PERMISSIONS = "permissions",
  
  // Student & Application Management
  STUDENTS = "students",
  APPLICATIONS = "applications",
  
  // Academic Resources
  UNIVERSITIES = "universities",
  PROGRAMS = "programs",
  COUNTRIES = "countries",
  CITIES = "cities",
  DEGREES = "degrees",
  FACULTIES = "faculties",
  SPECIALITIES = "specialities",
  LANGUAGES = "languages",
  
  // Academic Settings
  ACADEMIC_YEARS = "academic_years",
  SEMESTERS = "semesters",
  
  // Communication & Content
  ANNOUNCEMENTS = "announcements",
  
  // System
  SETTINGS = "settings",
  
  
}

export enum ActionType {
  CREATE = "create",
  EDIT = "edit",
  DELETE = "delete",
  VIEW = "view",
  EXPORT = "export",
  ViewAll = "view all",
}


export interface ZohoSemester {
  id: string;
  name?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: User

}


export interface Settings {
  id: string;
  site_name?: string;
  site_description?: string;
  site_image?: string;
  appearance_theme?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  logo_horizontal_url?: string;
  favicon_url?: string;
  meta_keywords?: string;
  meta_description?: string;
  contact_email?: string;
  social_links?: string;
  created_at?: string;
  updated_at?: string;
  logo_setting?: string;
  type?: string;
  agency_id?: string;
  user_id?: User

} 

export interface ZohoUniversity {
  id: string;
  name?: string;
  sector?: string;
  acomodation?: string;
  phone?: string;
  wesbite?: string;
  logo?: string;
  profile_image?: string;
  address?: string;
  city?: string;
  country?: string;
  created_at?: string;
  update_at?: string;
  year_founded?: string;
  active_in_apps?: boolean;
  qs_rank?: string;
  active?: boolean;
  times_higher_education_rank?: string;
  shanghai_ranking?: string;
  description?: string;
  // Related entities
  zoho_cities?: {
    id: string;
    name?: string;
  };
  zoho_countries?: {
    id: string;
    name: string;
    country_code?: string;
  };
  user_id?: User

}




export interface ZohoApplication {
  id: string;
  created_at?: string;
  updated_at?: string;
  student?: string | null;
  application_name?: string | null;
  program?: string | null;
  acdamic_year?: string | null;
  semester?: string | null;
  country?: string | null;
  university?: string | null;
  stage?: string;
  degree?: string | null;
  agent?: User | null;
  // Related entities
  zoho_students?: ZohoStudent;
  zoho_programs?: ZohoProgram;
  zoho_academic_years?: ZohoAcademicYear;
  zoho_semesters?: ZohoSemester;
  zoho_countries?: ZohoCountry;
  zoho_universities?: ZohoUniversity;
  zoho_degrees?: ZohoDegree;
  agency_id?: string | null;
  user_id?: string | null;
  agency?: User | null;
  user?: User | null;
  added_user?: User | null;
  crm_id?: string;
  online_application_id?: string | null;
  app_id?: string | null;
}
export interface ZohoCity {
  id: string;
  name?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
  
  // Related entities
  zoho_countries?: ZohoCountry;
  user_id?: User

}

export interface ZohoDegree {
  id: string;
  name?: string;
  code?: string;
  active?: boolean;
  created_at?: string;
  update_at?: string;
  user_id?: User

}

export interface ZohoFaculty {
  id: string;
  name?: string;
  active?: boolean;
  created_at?: string;
  update_at?: string;
  user_id?: User

}

export interface ZohoLanguage {
  id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: User
}







export interface ZohoProgram {
  id: string;
  name?: string;
  faculty_id?: string;
  speciality_id?: string;
  degree_id?: string;
  language_id?: string;
  university_id?: string;
  city_id?: string;
  country_id?: string;
  created_at?: string;
  updated_at?: string;
  official_tuition?: string;
  discounted_tuition?: string;
  tuition_currency?: string;
  active?: boolean;
  active_applications?: boolean;
  study_years?: string;
  agency_id?: string;
  user_id?: string;
  agency?: User;
  user?: User;
  tuition_fee_usd?: number;
  // Related entities
  zoho_countries?: ZohoCountry;
  zoho_degrees?: ZohoDegree;
  zoho_faculty?: ZohoFaculty;
  zoho_languages?: ZohoLanguage;
  zoho_speciality?: ZohoSpeciality;
  zoho_cities?: ZohoCity;
  zoho_universities?: ZohoUniversity;
}



export interface ZohoSpeciality {
  id: string;
  name?: string;
  active?: boolean;
  created_at?: string;
  update_at?: string;
  faculty_id?: string;
  
  // Related entities
  zoho_faculty?: ZohoFaculty;
}



export interface ZohoStudent {
  id: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  gender?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null ;
  passport_number?: string | null;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  country_of_residence?: string | null;
  email?: string;
  mobile?: string | null;
  father_name?: string;
  father_mobile?: string | null;
  father_job?: string | null;
  mother_name?: string;
  mother_mobile?: string | null;
  mother_job?: string | null;
  nationality_record?: ZohoCountry;
  country_of_residence_record?: ZohoCountry;
  agency_id?: string | null;
  user_id?: string;
  agency?: User | null;
  user?: User | null;
  agent?: User | null;
  crm_id?: string;
  photo_url?: string;
  documents?: any;
  education_level?: string | null;
  education_level_name?: string;
  high_school_country?: string | null;
  high_school_name?: string;
  high_school_gpa_percent?: number;
  bachelor_school_name?: string;
  bachelor_country?: string | null;
  bachelor_gpa_percent?: number | null;
  master_school_name?: string;
  master_country?: string | null;
  master_gpa_percent?: number | null;
  transfer_student?: string;
  have_tc?: string | null;
  tc_number?: string | null;
  blue_card?: string | null ;
  student_id?: string;
  address_line_1?: string;
  city_district?: string;
  state_province?: string;
  postal_code?: string;
  address_country?: string | null;
  address_country_record?: ZohoCountry;
  
  academic_level_record?: ZohoDegree;
}

export interface ZohoAttachment {
  id: string;
  created_at?: string;
  name?: string | null;
  module?: string | null;
  module_id?: string | null;
}
