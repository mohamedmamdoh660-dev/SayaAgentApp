"use client";

import React, { useState } from "react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Ellipsis, Edit, Trash, Ban, CheckCircle } from "lucide-react";
import { ZohoProgram } from "@/types/types";
import { zohoProgramsService } from "@/modules/zoho-programs/services/zoho-programs-service";
import ConfirmationDialogBox from "@/components/ui/confirmation-dialog-box";
import EditZohoProgram from "@/components/(main)/zoho-programs/component/edit-zoho-program";

interface ZohoProgramsTableRowActionsProps {
  row: Row<ZohoProgram>;
  fetchPrograms: () => void;
}

export function ZohoProgramsTableRowActions({
  row,
  fetchPrograms,
}: ZohoProgramsTableRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: "delete" | "activate" | "deactivate" | null;
  }>({ isOpen: false, action: null });

  const values: ZohoProgram = { ...row.original };

  const handleConfirmation = (action: "delete" | "activate" | "deactivate") => {
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
        await zohoProgramsService.deleteProgram(values.id);
        toast.success("Program deleted successfully");
      } else if (action === "activate") {
        await zohoProgramsService.updateProgram({
          id: values.id,
          active: true,
        });
        toast.success("Program activated successfully");
      } else if (action === "deactivate") {
        await zohoProgramsService.updateProgram({
          id: values.id,
          active: false,
        });
        toast.success("Program deactivated successfully");
      }

      setConfirmationDialog({ isOpen: false, action: null });
      fetchPrograms(); // Refresh the program list after action
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
          <DropdownMenuItem
            onClick={() => {
              setIsEditDialogOpen(true);
            }}
            className="cursor-pointer flex items-center"
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleConfirmation("delete")}
            className="cursor-pointer flex items-center"
          >
            <Trash className="mr-1 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditDialogOpen && (
        <EditZohoProgram
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          programData={values}
          fetchPrograms={fetchPrograms}
        />
      )}

      <ConfirmationDialogBox
        title={
          confirmationDialog.action === "delete"
            ? `Are you sure you want to delete this program?`
            : confirmationDialog.action === "deactivate"
              ? `Are you sure you want to deactivate this program?`
              : `Are you sure you want to activate this program?`
        }
        description={
          confirmationDialog.action === "delete"
            ? `This action cannot be undone. This will permanently delete the selected program.`
            : confirmationDialog.action === "deactivate"
              ? `This will make the program inactive.`
              : `This will make the program active.`
        }
        cancelText="Cancel"
        confirmText={
          confirmationDialog.action === "delete"
            ? "Delete"
            : confirmationDialog.action === "deactivate"
              ? "Deactivate"
              : "Activate"
        }
        isOpen={confirmationDialog.isOpen}
        setIsOpen={(isOpen: boolean) =>
          setConfirmationDialog((prev) => ({ ...prev, isOpen }))
        }
        loading={loading}
        onConfirm={onConfirm}
        icon={
          confirmationDialog.action === "delete" ? (
            <Trash className="mr-2 h-4 w-4" />
          ) : confirmationDialog.action === "deactivate" ? (
            <Ban className="mr-2 h-4 w-4" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )
        }
      />
    </>
  );
}
