"use client";
import { useState, useEffect } from "react";

import { getPermissionColumns } from "@/components/data-table/columns/column-permission";
import { DataTable } from "@/components/data-table/data-table";
import { rolesService, Role } from "@/modules/roles";
import { ResourceType, RoleAccess } from "@/types/types";
import { PermissionDataTableToolbar } from "@/components/data-table/toolbars/permission-toolbar";
import { useDebounce } from "@/hooks/use-debounce";

export default function PermissionManagementPage({ type }: { type: string }) {
  const [listPermissions, setListPermissions] = useState<RoleAccess[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesList = await rolesService.getAllRoles();
        setRoles(rolesList);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    // if (viewMode === "list") {
    fetchPermissions();
    // }
  }, [
    selectedRoleId,
    debouncedSearchTerm,
    selectedResource,
    selectedAction,
    viewMode,
  ]);

  async function fetchPermissions() {
    setIsRefetching(true);
    try {
      let permissions = await rolesService.getRoleAccess(
        selectedRoleId === "all" || selectedRoleId === null
          ? ""
          : selectedRoleId
      );

      // Filter by search term if provided
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        permissions = permissions.filter(
          (permission) =>
            permission.resource.toLowerCase().includes(lowerSearchTerm) ||
            permission.action.toLowerCase().includes(lowerSearchTerm)
        );
      }

      // Filter by resource if selected
      if (selectedResource) {
        permissions = permissions.filter(
          (permission) => permission.resource === selectedResource
        );
      }

      // Filter by action if selected
      if (selectedAction) {
        permissions = permissions.filter(
          (permission) => permission.action === selectedAction
        );
      }

      setListPermissions(
        permissions.filter(
          (permission) =>
            permission.resource !== ResourceType.ROLES &&
            permission.resource !== ResourceType.PERMISSIONS &&
            permission.roles.name !== "admin"
        )
      );
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
  };

  const handleGlobalFilterChange = (filter: string) => {
    setSearchQuery(filter);
  };

  const handleResourceFilterChange = (resource: string | null) => {
    setSelectedResource(resource);
  };

  const handleActionFilterChange = (action: string | null) => {
    setSelectedAction(action);
  };

  return (
    <div className="space-y-4">
      <DataTable
        data={listPermissions || []}
        toolbar={
          <PermissionDataTableToolbar
            fetchRecords={fetchPermissions}
            type={type}
            onGlobalFilterChange={handleGlobalFilterChange}
            onResourceFilterChange={handleResourceFilterChange}
            onActionFilterChange={handleActionFilterChange}
            roles={roles}
            selectedRoleId={selectedRoleId}
            handleRoleChange={handleRoleChange}
            selectedResource={selectedResource}
            selectedAction={selectedAction}
            setSelectedResource={setSelectedResource}
            setSelectedAction={setSelectedAction}
          />
        }
        columns={getPermissionColumns(() => fetchPermissions())}
        onGlobalFilterChange={handleGlobalFilterChange}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        pageSize={300}
        currentPage={1}
        loading={isRefetching}
        pagination={false}
        error={""}
        rowCount={listPermissions.length}
        type="permissions"
      />
      {/* </TabsContent>
      </Tabs> */}
    </div>
  );
}
