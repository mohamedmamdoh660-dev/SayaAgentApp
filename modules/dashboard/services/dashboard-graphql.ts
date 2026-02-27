export const GET_DASHBOARD_STATS = `
  query GetDashboardStats {
    # Total students count
    studentsCount: zoho_studentsCollection {
      aggregations {
        count
      }
    }
    
    # Total applications count
    applicationsCount: zoho_applicationsCollection {
      aggregations {
        count
      }
    }
    
    # Total universities count
    universitiesCount: zoho_universitiesCollection {
      aggregations {
        count
      }
    }
    
    # Application success rate (completed applications)
    completedApplications: zoho_applicationsCollection(filter: {stage: {eq: "completed"}}) {
      aggregations {
        count
      }
    }
  }
`;

export const GET_APPLICATION_STAGES = `
  query GetApplicationStages {
    pending: zoho_applicationsCollection(filter: {stage: {eq: "pending"}}) {
      aggregations {
        count
      }
    }
    processing: zoho_applicationsCollection(filter: {stage: {eq: "processing"}}) {
      aggregations {
        count
      }
    }
    completed: zoho_applicationsCollection(filter: {stage: {eq: "completed"}}) {
      aggregations {
        count
      }
    }
    failed: zoho_applicationsCollection(filter: {stage: {eq: "failed"}}) {
      aggregations {
        count
      }
    }
  }
`;

export const GET_UNIVERSITY_DISTRIBUTION = `
  query GetUniversityDistribution {
    zoho_applicationsCollection {
      groupBy {
        university {
          key
          zoho_universities {
            name
          }
          count
        }
      }
    }
  }
`;

export const GET_GENDER_DISTRIBUTION = `
  query GetGenderDistribution {
    zoho_studentsCollection {
      groupBy {
        gender {
          key
          count
        }
      }
    }
  }
`;

export const GET_RECENT_APPLICATIONS = `
  query GetRecentApplications($limit: Int = 10) {
    zoho_applicationsCollection(
      orderBy: [{ created_at: DESC }],
      first: $limit
    ) {
      edges {
        node {
          id
          created_at
          updated_at
          stage
          zoho_students {
            id
            first_name
            last_name
            email
          }
          zoho_programs {
            id
            name
          }
          zoho_universities {
            id
            name
            logo
          }
          zoho_academic_years {
            id
            name
          }
          zoho_semesters {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_APPLICATION_TIMELINE = `
  query GetApplicationTimeline($days: Int = 30) {
    # Get applications created in the last X days
    zoho_applicationsCollection(
      filter: {
        created_at: {
          gte: { custom: "now() - interval '$days days'" }
        }
      }
    ) {
      groupBy {
        created_at {
          day
          count
        }
        stage {
          key
          count
        }
      }
    }
  }
`;
