export const GET_ANNOUNCEMENTS = `
  query GetAnnouncements($filter: zoho_announcementsFilter, $limit: Int!, $offset: Int!, $orderBy: [zoho_announcementsOrderBy!]) {
    zoho_announcementsCollection(
      filter: $filter
      first: $limit
      offset: $offset
    orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          category
          description
          university
          program
          created_at
          updated_at
          zoho_universities {
            id
            name
            logo
          }
          zoho_programs {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_ANNOUNCEMENT_BY_ID = `
  query GetAnnouncementById($id: String!) {
    zoho_announcementsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          title
          category
          description
          university
          program
          created_at
          updated_at
          zoho_universities {
            id
            name
            logo
          }
          zoho_programs {
            id
            name
          }
        }
      }
    }
  }
`;

export const CREATE_ANNOUNCEMENT = `
  mutation CreateAnnouncement($objects: [zoho_announcementsInsertInput!]!) {
    insertIntozoho_announcementsCollection(objects: $objects) {
      records {
        id
        title
        category
        description
        university
        program
        created_at
        updated_at
      }
    }
  }
`;

export const UPDATE_ANNOUNCEMENT = `
  mutation UpdateAnnouncement(
    $id: String!
    $title: String
    $category: String
    $description: String
    $university: String
    $program: String
  ) {
    updatezoho_announcementsCollection(
      filter: { id: { eq: $id } }
      set: { 
        title: $title, 
        category: $category, 
        description: $description, 
        university: $university, 
        program: $program,
        updated_at: "now()"
      }
    ) {
      records {
        id
        title
        category
        description
        university
        program
        created_at
        updated_at
      }
    }
  }
`;

export const DELETE_ANNOUNCEMENT = `
  mutation DeleteAnnouncement($id: String!) {
    deleteFromzoho_announcementsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const ANNOUNCEMENTS_SUBSCRIPTION = `
  subscription OnAnnouncementsChanged {
    zoho_announcements {
      id
      title
      category
      description
      university
      program
      created_at
      updated_at
      zoho_universities {
        id
        name
        logo
      }
      zoho_programs {
        id
        name
      }
    }
  }
`;

export const ANNOUNCEMENT_BY_ID_SUBSCRIPTION = `
  subscription OnAnnouncementChanged($id: bigint!) {
    zoho_announcements_by_pk(id: $id) {
      id
      title
      category
      description
      university
      program
      created_at
      updated_at
      zoho_universities {
        id
        name
        logo
      }
      zoho_programs {
        id
        name
      }
    }
  }
`;