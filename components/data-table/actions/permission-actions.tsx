"use client";
import React, { useState } from "react";
import { Ellipsis, Trash } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ConfirmationDialogBox from "@/components/ui/confirmation-dialog-box";
// import { rolesService } from "@/modules/roles";
import { rolesService } from "@/modules";
import { RoleAccess } from "@/types/types";

interface PermissionTableRowActionsProps {
  row: Row<RoleAccess>;
  fetchPermissions: () => void;
}

export function PermissionTableRowActions({
  row,
  fetchPermissions,
}: PermissionTableRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: "delete" | null;
  }>({ isOpen: false, action: null });

  const values: RoleAccess = { ...row.original };

  const handleConfirmation = (action: "delete") => {
    setConfirmationDialog({ isOpen: true, action });
  };

  const onConfirm = async () => {
    if (!values?.id) {
      return;
    }
    try {
      setLoading(true);
      const action = confirmationDialog.action;
      if (action === "delete") {
        await rolesService.deleteRoleAccess(values?.id);
        setConfirmationDialog({ isOpen: false, action: null });
        fetchPermissions(); // Refresh the list after action
        toast.success(`Permission Removed Successfully`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Unknown error");
    } finally {
      setLoading(false);
      setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          {/* <DeleteProtected resource={ResourceType.PERMISSIONS}> */}
          <DropdownMenuItem
            onClick={() => handleConfirmation("delete")}
            className="cursor-pointer flex items-center"
          >
            <Trash className="mr-1 h-4 w-4" />
            Remove
          </DropdownMenuItem>
          {/* </DeleteProtected> */}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialogBox
        title={`Are you sure you want to remove this permission?`}
        description={`This action cannot be undone. This will permanently delete the selected permission.`}
        cancelText="Cancel"
        confirmText="Remove"
        isOpen={confirmationDialog.isOpen}
        setIsOpen={(isOpen: boolean) =>
          setConfirmationDialog((prev) => ({ ...prev, isOpen }))
        }
        loading={loading}
        onConfirm={onConfirm}
        icon={<Trash className="mr-2 h-4 w-4" />}
      />
    </>
  );
}
