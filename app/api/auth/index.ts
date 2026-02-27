// This file can be used to expose any utility functions related to auth API routes
// Note: Next.js API routes are automatically loaded based on the file structure
// so explicit exports aren't necessary for the routes to function

export const API_ROUTES = {
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  LOGOUT: '/api/auth/logout',
  ACCEPT_INVITE: '/api/auth/accept-invite'
};

// Export this object to be used in client-side code for consistent API paths
export default API_ROUTES; 