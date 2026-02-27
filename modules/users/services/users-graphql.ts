// GraphQL mutation to insert user into users table
export const INSERT_USER = `
  mutation InsertUser($objects: [user_profileInsertInput!]!) {
    insertIntouser_profileCollection(objects: $objects) {
      affectedCount
      records {
        id
        email
        role_id
        first_name
        last_name
        is_active
        created_at
        profile
      }
    }
  }
`;


export const GET_USERS_BY_EMAIL = `
query GetUsersByEmail($filter: user_profileFilter) {
  user_profileCollection(filter: $filter) {
    edges {
      node {
        id
        email
        role_id
        first_name
        last_name
        is_active
        last_login
        profile
        created_at
      }
    }
  }
}
`;

export const GET_USERS_PAGINATION = `
query GetUsers($filter: user_profileFilter, $limit: Int = 10, $offset: Int = 0, $sorting: user_profileOrderBy) {
  user_profileCollection(
    filter: $filter
    first: $limit
    offset: $offset
    orderBy: $sorting
  ) {
    edges {
      node {
        id
        email
        role_id
        first_name
        last_name
        is_active
        agency: user_profile {
          settings:settingsCollection {
            edges {
              node {
                site_name
                logo_url
              }
            }
          }
        }
        settings: settingsCollection {
          edges {
            node {
              site_name
              logo_url
            }
          }
        }
        last_login
        profile
        created_at
        updated_at
        agency_id
        agency: user_profile {
          full_name
        }
        roles {
          name
          description
          role_accessCollection {
            edges {
              node {
                resource
                action
              }
            }
          }
        }
      }
    }
  }
}
`;
export const GET_USERS_COUNT = `
query CountUsers($filter: user_profileFilter) {
  user_profileCollection(
    filter: $filter
  ) {
    edges{
      node{
        id
      }
    }
  }
}
`;

export const GET_USERS = `
    query GetUsers {
     user_profileCollection {
       edges {
         node {
           id
           email
           role_id
           first_name
           last_name
           is_active
           last_login
           profile
           created_at
           updated_at
           roles {
             name
             description
             role_accessCollection {
               edges {
                 node {
                   resource
                   action
                 }
               }
             }
           }
         }
       }
     }
   }
   
   `;


export const GET_USERS_BY_ID = `
query GetUsersById($id: UUID!) {
 user_profileCollection(filter: {id: {eq: $id}}) {
   edges {
     node {
       id
       email
       role_id
       first_name
       last_name
       is_active
       last_login
       profile
       created_at
       updated_at
       crm_id
       agency: user_profile {
           crm_id
           
         
       }
       agency_id
       roles {
         name
         description
         role_accessCollection {
           edges {
             node {
               resource
               action
             }
           }
         }
       }
     }
   }
 }
}
`;

export const UPDATE_USER = `
  mutation UpdateUser(
    $id: UUID!
    $first_name: String
    $last_name: String
    $full_name: String
    $role_id: UUID! 
    $profile: String
    $is_active: Boolean
  ) {
    updateuser_profileCollection(
      filter: { id: { eq: $id } }
      set: {
        first_name: $first_name
        last_name: $last_name
        full_name: $full_name
        role_id: $role_id
        profile: $profile
        is_active: $is_active
      }
    ) {
      affectedCount
      records {
        id
        email
        first_name
        last_name
        role_id
        profile
        is_active
      }
    }
  }
`;

export const DELETE_USER = `
mutation deleteUser($id: UUID!) {
  deleteFromuser_profileCollection(filter: {id: {eq: $id}}) {
    affectedCount
  }
}
`;