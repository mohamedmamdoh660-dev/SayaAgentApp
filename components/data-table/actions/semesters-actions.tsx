"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ZohoSemester } from "@/types/types";
import { semestersService } from "@/modules/semesters/services/semesters-service";
import EditSemester from "@/components/(main)/semesters/component/edit-semester";

interface SemestersActionsProps {
  semester: ZohoSemester;
}

export function SemestersActions({ semester }: SemestersActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Delete semester
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await semestersService.deleteSemester(semester.id);
      toast.success("Semester deleted successfully");
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error deleting semester:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete semester"
      );
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Toggle semester active status
  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const newStatus = !semester.active;
      await semestersService.toggleSemesterStatus(semester.id, newStatus);
      toast.success(
        `Semester ${newStatus ? "activated" : "deactivated"} successfully`
      );
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error updating semester status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update semester status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleStatus}>
            {semester.active ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              semester "{semester.name}" and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <EditSemester
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        semester={semester}
        onRefresh={() => window.location.reload()}
      />
    </>
  );
}
