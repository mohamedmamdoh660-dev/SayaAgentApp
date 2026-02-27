"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { rolesService } from "@/modules/roles";
import { Role, RoleAccess } from "@/types/types";
import { ResourceType, ActionType } from "@/types/types";
import { Loader2, Save, X, Check, InfoIcon, Search } from "lucide-react";
import InfoGraphic from "@/components/ui/info-graphic";

interface PermissionMatrixProps {
  roles: Role[];
  onPermissionsUpdated: () => void;
}

// Resource categories for better organization
const RESOURCE_CATEGORIES = {
  Core: [ResourceType.DASHBOARD],
  "User Management": [
    ResourceType.USERS,
    ResourceType.ROLES,
    ResourceType.PERMISSIONS,
  ],
  "Student & Application": [ResourceType.STUDENTS, ResourceType.APPLICATIONS],
  "Academic Resources": [
    ResourceType.UNIVERSITIES,
    ResourceType.PROGRAMS,
    ResourceType.COUNTRIES,
    ResourceType.CITIES,
    ResourceType.DEGREES,
    ResourceType.FACULTIES,
    ResourceType.SPECIALITIES,
    ResourceType.LANGUAGES,
  ],
  "Academic Settings": [ResourceType.ACADEMIC_YEARS, ResourceType.SEMESTERS],
  Communication: [ResourceType.ANNOUNCEMENTS],
  System: [ResourceType.SETTINGS],
};

// Main CRUD actions for the matrix
const MATRIX_ACTIONS = [
  ActionType.CREATE,
  ActionType.VIEW,
  ActionType.EDIT,
  ActionType.DELETE,
];

export default function PermissionMatrix({
  roles,
  onPermissionsUpdated,
}: PermissionMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(
    roles[0] || null
  );
  const [permissions, setPermissions] = useState<RoleAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedRole(roles[0] || null);
  }, [roles]);

  // Load permissions when role changes
  useEffect(() => {
    const loadPermissions = async () => {
      if (!selectedRole) {
        setPermissions([]);
        return;
      }

      setLoading(true);
      try {
        const rolePermissions = await rolesService.getRoleAccess(
          selectedRole.id
        );
        setPermissions(rolePermissions);
        setHasChanges(false);
      } catch (error) {
        console.error("Error loading permissions:", error);
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [selectedRole]);

  // Check if a specific permission exists
  const hasPermission = (
    resource: ResourceType,
    action: ActionType
  ): boolean => {
    return permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  // Toggle a specific permission
  const togglePermission = (resource: ResourceType, action: ActionType) => {
    const exists = hasPermission(resource, action);

    if (exists) {
      setPermissions(
        permissions.filter(
          (p) => !(p.resource === resource && p.action === action)
        )
      );
    } else {
      setPermissions([
        ...permissions,
        {
          id: crypto.randomUUID(),
          role_id: selectedRole!.id,
          resource,
          action,
          created_at: new Date().toISOString(),
        } as RoleAccess,
      ]);
    }
    setHasChanges(true);
  };

  // Select all permissions for a specific action
  const selectAllForAction = (action: ActionType) => {
    const allResources = Object.values(RESOURCE_CATEGORIES).flat();
    const newPermissions = [...permissions];

    allResources.forEach((resource) => {
      const exists = permissions.some(
        (p) => p.resource === resource && p.action === action
      );
      if (!exists) {
        newPermissions.push({
          id: crypto.randomUUID(),
          role_id: selectedRole!.id,
          resource,
          action,
          created_at: new Date().toISOString(),
        } as RoleAccess);
      }
    });

    setPermissions(newPermissions);
    setHasChanges(true);
  };

  // Deselect all permissions for a specific action
  const deselectAllForAction = (action: ActionType) => {
    setPermissions(permissions.filter((p) => p.action !== action));
    setHasChanges(true);
  };

  // Give all permissions for a specific resource
  const giveAllPermissions = (resource: ResourceType) => {
    const newPermissions = [...permissions];

    MATRIX_ACTIONS.forEach((action) => {
      const exists = permissions.some(
        (p) => p.resource === resource && p.action === action
      );
      if (!exists) {
        newPermissions.push({
          id: crypto.randomUUID(),
          role_id: selectedRole!.id,
          resource,
          action,
          created_at: new Date().toISOString(),
        } as RoleAccess);
      }
    });

    setPermissions(newPermissions);
    setHasChanges(true);
  };

  // Save permissions
  const savePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      // Get current permissions from server
      const currentPermissions = await rolesService.getRoleAccess(
        selectedRole.id
      );

      // Find permissions to delete
      const permissionsToDelete = currentPermissions.filter(
        (current) =>
          !permissions.some(
            (p) =>
              p.resource === current.resource && p.action === current.action
          )
      );

      // Find permissions to add
      const permissionsToAdd = permissions.filter(
        (p) =>
          !currentPermissions.some(
            (current) =>
              current.resource === p.resource && current.action === p.action
          )
      );

      // Delete removed permissions
      for (const permission of permissionsToDelete) {
        await rolesService.deleteRoleAccess(permission.id);
      }

      // Add new permissions
      for (const permission of permissionsToAdd) {
        await rolesService.createRoleAccess(
          selectedRole.id,
          permission.resource,
          permission.action
        );
      }

      toast.success("Permissions saved successfully");
      setHasChanges(false);
      onPermissionsUpdated();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // Filter resources based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return RESOURCE_CATEGORIES;

    const filtered: typeof RESOURCE_CATEGORIES = {} as any;
    Object.entries(RESOURCE_CATEGORIES).forEach(([category, resources]) => {
      const matchingResources = resources.filter((resource) =>
        resource.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingResources.length > 0) {
        filtered[category as keyof typeof RESOURCE_CATEGORIES] =
          matchingResources;
      }
    });
    return filtered;
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="relative ">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[400px] bg-background"
              autoComplete="off"
              disabled={!selectedRole}
            />
          </div>
          <div className="flex-1">
            <Select
              value={selectedRole?.id || ""}
              onValueChange={(value) => {
                const role = roles.find((r) => r.id === value);
                setSelectedRole(role || null);
              }}
            >
              <SelectTrigger
                className={`${!selectedRole ? "!w-[300px]" : "w-max"}`}
              >
                <SelectValue placeholder="Choose a role to manage permissions" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id}
                    className="capitalize"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => {
                if (selectedRole) {
                  rolesService
                    .getRoleAccess(selectedRole.id)
                    .then(setPermissions);
                  setHasChanges(false);
                }
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Discard
            </Button>
          )}

          <Button
            size="sm"
            onClick={savePermissions}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card className="pt-0">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left font-semibold min-w-[250px] sticky left-0 bg-muted/50 z-10">
                        Resource
                      </th>
                      {MATRIX_ACTIONS.map((action) => (
                        <th
                          key={action}
                          className="p-4 text-center font-semibold min-w-[120px] hover:bg-muted/50"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="capitalize">{action}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs "
                                onClick={() => selectAllForAction(action)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs "
                                onClick={() => deselectAllForAction(action)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                None
                              </Button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="p-4 text-center font-semibold min-w-[150px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(filteredCategories).map(
                      ([category, resources]) => (
                        <>
                          {resources.map((resource) => (
                            <tr
                              key={resource}
                              className="border-b hover:bg-muted/50 transition-color"
                            >
                              <td className="p-4 sticky left-0 bg-background">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium capitalize">
                                    {resource?.replace(/_/g, " ") || ""}
                                  </span>
                                </div>
                              </td>
                              {MATRIX_ACTIONS.map((action) => (
                                <td key={action} className="p-4 text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={hasPermission(resource, action)}
                                      onCheckedChange={() =>
                                        togglePermission(resource, action)
                                      }
                                    />
                                  </div>
                                </td>
                              ))}
                              <td className="p-4 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => giveAllPermissions(resource)}
                                >
                                  Give all permissions
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedRole && (
        <div className="flex items-center justify-center h-[calc(100vh-400px)]">
          <InfoGraphic
            icon={<InfoIcon className="!h-14 !w-14 text-primary" />}
            title="No Role Selected"
            description="Please select a role above to manage its permissions"
            isLeftArrow={false}
            gradient={false}
          />
        </div>
      )}
    </div>
  );
}
