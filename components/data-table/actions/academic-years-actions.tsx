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
import { ZohoAcademicYear } from "@/types/types";
import { academicYearsService } from "@/modules/academic-years/services/academic-years-service";
import EditAcademicYear from "@/components/(main)/academic-years/component/edit-academic-year";

interface AcademicYearsActionsProps {
  academicYear: ZohoAcademicYear;
}

export function AcademicYearsActions({
  academicYear,
}: AcademicYearsActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Delete academic year
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await academicYearsService.deleteAcademicYear(academicYear.id);
      toast.success("Academic year deleted successfully");
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error deleting academic year:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete academic year"
      );
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Toggle academic year active status
  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const newStatus = !academicYear.active;
      await academicYearsService.toggleAcademicYearStatus(
        academicYear.id,
        newStatus
      );
      toast.success(
        `Academic year ${newStatus ? "activated" : "deactivated"} successfully`
      );
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error updating academic year status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update academic year status"
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
            {academicYear.active ? (
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
              academic year "{academicYear.name}" and remove it from the
              database.
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
      <EditAcademicYear
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        academicYear={academicYear}
        onRefresh={() => window.location.reload()}
      />
    </>
  );
}
