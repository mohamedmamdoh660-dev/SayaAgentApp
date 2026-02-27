
import { ResourceType, ActionType, User } from "@/types/types";


/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userData: User | null, 
  resource: ResourceType | string, 
  action: ActionType | string
): boolean {
  try {
    if (!userData) return false;

    const roleAccess = userData?.roles?.role_accessCollection?.edges;
    
    return roleAccess?.some(
      (access) => access.node.resource === resource && access.node.action === action
    ) || false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if user can access a module (has read permission)
 */
export function canAccessModule(userData: User | null, resource: ResourceType | string): boolean {
  return hasPermission(userData, resource, ActionType.VIEW) || hasPermission(userData, resource, ActionType.VIEW);
}

/**
 * Check if user can create resources
 */
export function canCreate(userData: User | null, resource: ResourceType | string): boolean {
  return hasPermission(userData, resource, ActionType.CREATE);
}

/**
 * Check if user can view all resources
 */
export function canViewAll(userData: User | null, resource: ResourceType | string): boolean {
  return hasPermission(userData, resource, ActionType.ViewAll);
}

/**
 * Check if user can edit resources
 */
export function canEdit(userData: User | null, resource: ResourceType | string): boolean {
  return hasPermission(userData, resource, ActionType.EDIT);
}

/**
 * Check if user can delete resources
 */
export function canDelete(userData: User | null, resource: ResourceType | string): boolean {
  if (!userData) return false;
  return hasPermission(userData, resource, ActionType.DELETE);
}

/**
 * Check if user can view specific resource details
 */
export function canView(userData: User | null, resource: ResourceType | string): boolean {
  return hasPermission(userData, resource, ActionType.VIEW);
}

/**
 * Check if user can export resources
 */
export function canExport(userData: User | null, resource: ResourceType | string): boolean {
  return hasPermission(userData, resource, ActionType.EXPORT);
} 

/**
 * Parse user data from cookie string
 */
export function parseUserData(cookieData: string): User | null {
  try {
    const decodedData = decodeURIComponent(cookieData);
    return JSON.parse(decodedData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(userData: User | null): Array<{ resource: string; action: string }> {
  try {
    if (!userData) return [];

    const roleAccess = userData.roles?.role_accessCollection?.edges;
    
    return roleAccess?.map((access) => ({
      resource: access.node.resource,
      action: access.node.action,
    })) || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
} 