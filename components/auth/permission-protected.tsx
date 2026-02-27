"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { ResourceType, ActionType } from "@/types/types";

interface PermissionProtectedProps {
  resource: ResourceType;
  action: ActionType;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that shows children only if user has the specified permission
 */
export function PermissionProtected({
  resource,
  action,
  children,
  fallback = null,
}: PermissionProtectedProps) {
  const { userProfile } = useAuth();

  // Check if user has the required permission
  const hasPermission = () => {
    if (!userProfile?.roles?.role_accessCollection) return false;

    const permissions = userProfile.roles.role_accessCollection.edges || [];

    return permissions.some(
      (edge: { node: { resource: string; action: string } }) =>
        edge.node.resource === resource && edge.node.action === action
    );
  };

  if (!hasPermission()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Shorthand components for common permission checks
 */
export function CreateProtected({
  resource,
  children,
  fallback,
}: Omit<PermissionProtectedProps, "action">) {
  return (
    <PermissionProtected
      resource={resource}
      action={ActionType.CREATE}
      fallback={fallback}
    >
      {children}
    </PermissionProtected>
  );
}

export function ReadProtected({
  resource,
  children,
  fallback,
}: Omit<PermissionProtectedProps, "action">) {
  return (
    <PermissionProtected
      resource={resource}
      action={ActionType.VIEW}
      fallback={fallback}
    >
      {children}
    </PermissionProtected>
  );
}

export function EditProtected({
  resource,
  children,
  fallback,
}: Omit<PermissionProtectedProps, "action">) {
  return (
    <PermissionProtected
      resource={resource}
      action={ActionType.EDIT}
      fallback={fallback}
    >
      {children}
    </PermissionProtected>
  );
}

export function DeleteProtected({
  resource,
  children,
  fallback,
}: Omit<PermissionProtectedProps, "action">) {
  return (
    <PermissionProtected
      resource={resource}
      action={ActionType.DELETE}
      fallback={fallback}
    >
      {children}
    </PermissionProtected>
  );
}

export function ViewProtected({
  resource,
  children,
  fallback,
}: Omit<PermissionProtectedProps, "action">) {
  return (
    <PermissionProtected
      resource={resource}
      action={ActionType.VIEW}
      fallback={fallback}
    >
      {children}
    </PermissionProtected>
  );
}

/**
 * Hook to check permissions programmatically
 */
export function usePermission() {
  const { userProfile } = useAuth();

  const hasPermission = (
    resource: ResourceType,
    action: ActionType
  ): boolean => {
    if (!userProfile?.roles?.role_accessCollection) return false;

    const permissions = userProfile.roles.role_accessCollection.edges || [];

    return permissions.some(
      (edge: { node: { resource: string; action: string } }) =>
        edge.node.resource === resource && edge.node.action === action
    );
  };

  const canCreate = (resource: ResourceType) =>
    hasPermission(resource, ActionType.CREATE);
  const canRead = (resource: ResourceType) =>
    hasPermission(resource, ActionType.VIEW);
  const canEdit = (resource: ResourceType) =>
    hasPermission(resource, ActionType.EDIT);
  const canDelete = (resource: ResourceType) =>
    hasPermission(resource, ActionType.DELETE);
  const canView = (resource: ResourceType) =>
    hasPermission(resource, ActionType.VIEW);

  return {
    hasPermission,
    canCreate,
    canRead,
    canEdit,
    canDelete,
    canView,
  };
}
