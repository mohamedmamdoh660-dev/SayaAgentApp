"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash, ExternalLink } from "lucide-react";
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
import { ZohoUniversity } from "@/types/types";
import { universitiesService } from "@/modules/universities/services/universities-service";
import EditUniversity from "@/components/(main)/universities/component/edit-university";

interface UniversitiesActionsProps {
  university: ZohoUniversity;
}

export function UniversitiesActions({ university }: UniversitiesActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Delete university
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await universitiesService.deleteUniversity(university.id);
      toast.success("University deleted successfully");
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error deleting university:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete university"
      );
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Visit website
  const handleVisitWebsite = () => {
    if (university.wesbite) {
      const url = university.wesbite.startsWith("http")
        ? university.wesbite
        : `https://${university.wesbite}`;
      window.open(url, "_blank");
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
          {university.wesbite && (
            <DropdownMenuItem onClick={handleVisitWebsite}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Website
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              university "{university.name}" and remove it from the database.
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
      <EditUniversity
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        university={university}
        onRefresh={() => window.location.reload()}
      />
    </>
  );
}
