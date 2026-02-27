"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Plus, RefreshCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionType, ResourceType, RoleAccess, UserRoles } from "@/types/types";
import { CreateProtected } from "@/components/auth/permission-protected";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { rolesService } from "@/modules/roles";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/types/types";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { rolesService } from "@/modules";

// Resource-specific actions mapping
const RESOURCE_ACTIONS: Record<ResourceType, ActionType[]> = {
  [ResourceType.DASHBOARD]: [ActionType.VIEW],
  [ResourceType.STUDENTS]: [
    ActionType.CREATE,
    ActionType.VIEW,
    ActionType.ViewAll,
  ],
  [ResourceType.APPLICATIONS]: [
    ActionType.VIEW,
    ActionType.CREATE,
    ActionType.ViewAll,
  ],
  [ResourceType.PROGRAMS]: [ActionType.VIEW, ActionType.EXPORT],
  // All other resources: only VIEW
  [ResourceType.USERS]: [
    ActionType.VIEW,
    ActionType.CREATE,
    ActionType.DELETE,
    ActionType.EDIT,
  ],
  [ResourceType.ROLES]: [ActionType.VIEW],
  [ResourceType.PERMISSIONS]: [ActionType.VIEW],
  [ResourceType.UNIVERSITIES]: [ActionType.VIEW],
  [ResourceType.COUNTRIES]: [ActionType.VIEW],
  [ResourceType.CITIES]: [ActionType.VIEW],
  [ResourceType.DEGREES]: [ActionType.VIEW],
  [ResourceType.FACULTIES]: [ActionType.VIEW],
  [ResourceType.SPECIALITIES]: [ActionType.VIEW],
  [ResourceType.LANGUAGES]: [ActionType.VIEW],
  [ResourceType.ACADEMIC_YEARS]: [ActionType.VIEW],
  [ResourceType.SEMESTERS]: [ActionType.VIEW],
  [ResourceType.ANNOUNCEMENTS]: [ActionType.VIEW],
  [ResourceType.SETTINGS]: [ActionType.VIEW],
};

// Convert enum to options array, excluding ROLES and PERMISSIONS
const resourceOptions: Option[] = Object.values(ResourceType)
  .filter(
    (resource) =>
      resource !== ResourceType.ROLES && resource !== ResourceType.PERMISSIONS
  )
  .map((resource) => ({
    value: resource,
    label: resource,
  }));

const actionOptions: Option[] = Object.values(ActionType).map((action) => ({
  value: action,
  label: action,
}));

const formSchema = z.object({
  role: z.string().min(1, { message: "Role is required" }),
  resources: z
    .array(z.string())
    .min(1, { message: "At least one resource is required" }),
  actions: z.string().min(1, { message: "Action is required" }),
});

interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  onRefresh?: () => void;
  onExport?: () => void;
  tableName?: string;
  onGlobalFilterChange?: (value: string) => void;
  onResourceFilterChange?: (value: string | null) => void;
  onActionFilterChange?: (value: string | null) => void;
  fetchRecords: () => void;
  type?: string;
  roles: Role[];
  selectedRoleId: string | null;
  handleRoleChange: (roleId: string) => void;
  selectedResource: string | null;
  selectedAction: string | null;
  setSelectedResource: (value: string | null) => void;
  setSelectedAction: (value: string | null) => void;
}

export function PermissionDataTableToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
  onResourceFilterChange,
  onActionFilterChange,
  fetchRecords,
  type,
  roles,
  selectedRoleId,
  handleRoleChange,
  selectedResource,
  selectedAction: filterSelectedAction,
  setSelectedResource,
  setSelectedAction,
}: DataTableToolbarProps<TData>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingPermissions, setExistingPermissions] = useState<RoleAccess[]>(
    []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "",
      resources: [],
      actions: "",
    },
  });

  const formSelectedRole = form.watch("role");
  const formSelectedAction = form.watch("actions");
  const formSelectedResources = form.watch("resources");

  // Get available resources based on selected action
  const getAvailableResources = (action: ActionType | string): Option[] => {
    if (!action) {
      return resourceOptions;
    }

    // Filter resources that support the selected action
    const availableResourceTypes = Object.entries(RESOURCE_ACTIONS)
      .filter(([_, actions]) => actions.includes(action as ActionType))
      .map(([resource]) => resource);

    return resourceOptions.filter((option) =>
      availableResourceTypes.includes(option.value)
    );
  };

  const availableResources = getAvailableResources(formSelectedAction);

  // Load existing permissions when role changes
  useEffect(() => {
    const loadExistingPermissions = async (roleId: string) => {
      const permissions = await rolesService.getRoleAccess(roleId);
      setExistingPermissions(permissions);
    };

    if (formSelectedRole) {
      loadExistingPermissions(formSelectedRole);
    } else {
      setExistingPermissions([]);
    }
  }, [formSelectedRole]);

  // Update resources when role or action changes
  useEffect(() => {
    if (existingPermissions.length > 0 && formSelectedAction) {
      // Filter resources that have the selected action
      const resourcesForAction = existingPermissions
        .filter((p) => p.action === formSelectedAction)
        .map((p) => p.resource)
        .filter(
          (resource) =>
            resource !== ResourceType.ROLES &&
            resource !== ResourceType.PERMISSIONS
        );

      form.setValue("resources", resourcesForAction);
    } else {
      form.setValue("resources", []);
    }
  }, [existingPermissions, formSelectedAction, form]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onGlobalFilterChange?.(value);
  };

  const handleResourceFilterChange = (value: string | null) => {
    setSelectedResource(value === "all" ? null : value);
    onResourceFilterChange?.(value === "all" ? null : value);
  };

  const handleActionFilterChange = (value: string | null) => {
    setSelectedAction(value === "all" ? null : value);
    onActionFilterChange?.(value === "all" ? null : value);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      // First, get all existing permissions for the selected role
      const currentRolePermissions = existingPermissions.filter(
        (p) => p.role_id === data.role && p.action === data.actions
      );

      // Find permissions to remove:
      // 1. All permissions for the selected role and action that are not in the new resources list
      // 2. All permissions for the selected role that have different actions
      const permissionsToRemove = currentRolePermissions.filter(
        (p) =>
          (p.action === data.actions && !data.resources.includes(p.resource)) || // Remove if resource not selected
          (data.resources.includes(p.resource) && p.action !== data.actions) // Remove if action different
      );

      // Delete removed permissions
      for (const permission of permissionsToRemove) {
        await rolesService.deleteRoleAccess(permission.id);
      }

      // Find permissions to add:
      // Check each resource in the new selection
      const existingCombinations = currentRolePermissions.map(
        (p) => `${p.resource}-${p.action}`
      );

      const permissionsToAdd = data.resources
        .map((resource) => {
          const combo = `${resource}-${data.actions}`;
          // Only add if this combination doesn't exist
          if (!existingCombinations.includes(combo)) {
            return {
              role_id: data.role,
              resource,
              action: data.actions,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Add new permissions
      const addPromises = permissionsToAdd.map(
        (permission) =>
          permission &&
          rolesService.createRoleAccess(
            permission.role_id,
            permission.resource,
            permission.action
          )
      );

      await Promise.all(addPromises);

      setIsDialogOpen(false);
      form.reset();
      fetchRecords();
      toast.success("Permissions updated successfully");
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="min-w-[200px] max-w-max">
            <Select
              value={selectedRoleId || ""}
              onValueChange={handleRoleChange}
              disabled={roles.length === 0}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles
                  .filter((role) => role.name !== "admin")
                  .map((role) => (
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
          <div className="w-[200px]">
            <Select
              value={selectedResource || ""}
              onValueChange={(value) =>
                handleResourceFilterChange(value || null)
              }
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder="Filter by Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {Object.values(ResourceType)
                  .filter(
                    (resource) =>
                      resource !== ResourceType.ROLES &&
                      resource !== ResourceType.PERMISSIONS
                  )
                  .filter((resource) => {
                    if (
                      roles.find((role) => role.id === selectedRoleId)?.name !==
                        UserRoles.ADMIN &&
                      roles.find((role) => role.id === selectedRoleId)?.name !==
                        UserRoles.AGENT &&
                      selectedRoleId
                    ) {
                      return resource !== ResourceType.USERS;
                    }
                    return true;
                  })
                  .map((resource) => (
                    <SelectItem
                      key={resource}
                      value={resource}
                      className="capitalize"
                    >
                      {resource}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select
              value={filterSelectedAction || ""}
              onValueChange={(value) => handleActionFilterChange(value || null)}
            >
              <SelectTrigger className="capitalize">
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.values(ActionType).map((action) => (
                  <SelectItem
                    key={action}
                    value={action}
                    className="capitalize"
                  >
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filterSelectedAction || selectedResource) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAction(null);
                setSelectedResource(null);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            className="hidden lg:flex"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>

          {table && <DataTableViewOptions table={table} />}
          <CreateProtected resource={ResourceType.PERMISSIONS}>
            <div className="">
              <Button
                variant="default"
                size="sm"
                className=""
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Permission
              </Button>
            </div>
          </CreateProtected>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manage Permissions</DialogTitle>
                <DialogDescription>
                  Select a role and action first. Available resources will be
                  shown based on your action selection.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset action and resources when role changes
                            form.setValue("actions", "");
                            form.setValue("resources", []);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="capitalize">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles
                              .filter((role) => role.name !== "admin")
                              .map((role) => (
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!formSelectedRole}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ActionType).map((action) => (
                              <SelectItem key={action} value={action}>
                                {action}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resources"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Resources
                          {formSelectedAction && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (Resources that support {formSelectedAction})
                            </span>
                          )}
                        </FormLabel>
                        <MultipleSelector
                          key={formSelectedAction || "no-action"}
                          value={field.value.map((value) => ({
                            value,
                            label: value,
                          }))}
                          onChange={(options) =>
                            field.onChange(options.map((opt) => opt.value))
                          }
                          defaultOptions={availableResources.filter(
                            (resource) => {
                              // If user is not admin or agent, filter out USERS and SETTINGS
                              if (
                                roles.find(
                                  (role) => role.id === formSelectedRole
                                )?.name !== UserRoles.ADMIN &&
                                roles.find(
                                  (role) => role.id === formSelectedRole
                                )?.name !== UserRoles.AGENT
                              ) {
                                return resource.value !== ResourceType.USERS;
                              }
                              return true;
                            }
                          )}
                          placeholder={
                            !formSelectedRole || !formSelectedAction
                              ? "Select a role and action first"
                              : "Select resources"
                          }
                          disabled={!formSelectedRole || !formSelectedAction}
                          hideClearAllButton={false}
                          emptyIndicator={
                            !formSelectedRole ? (
                              <p className="text-center text-sm">
                                Select a role first
                              </p>
                            ) : !formSelectedAction ? (
                              <p className="text-center text-sm">
                                Select an action first
                              </p>
                            ) : (
                              <p className="text-center text-sm">
                                No resources found for this action
                              </p>
                            )
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        form.reset();
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        !formSelectedRole ||
                        !formSelectedAction ||
                        formSelectedResources.length === 0
                      }
                    >
                      {loading ? "Updating..." : "Update Permissions"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
