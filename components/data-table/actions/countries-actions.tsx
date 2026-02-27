"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
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
import { ZohoCountry } from "@/types/types";
import { countriesService } from "@/modules/countries/services/countries-service";
import EditCountry from "@/components/(main)/countries/component/edit-country";

interface CountriesActionsProps {
  country: ZohoCountry;
}

export function CountriesActions({ country }: CountriesActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Delete country
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await countriesService.deleteCountry(country.id);
      toast.success("Country deleted successfully");
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error deleting country:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete country"
      );
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Toggle country active status for nationalities
  const handleToggleNationalitiesStatus = async () => {
    setIsLoading(true);
    try {
      const newStatus = !country.active_on_nationalities;
      await countriesService.toggleCountryNationalitiesStatus(
        country.id,
        newStatus
      );
      toast.success(
        `Country ${newStatus ? "activated" : "deactivated"} for nationalities successfully`
      );
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error updating country nationalities status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update country nationalities status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle country active status for universities
  const handleToggleUniversityStatus = async () => {
    setIsLoading(true);
    try {
      const newStatus = !country.active_on_university;
      await countriesService.toggleCountryUniversityStatus(
        country.id,
        newStatus
      );
      toast.success(
        `Country ${newStatus ? "activated" : "deactivated"} for universities successfully`
      );
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error updating country university status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update country university status"
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
          {/* <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleNationalitiesStatus}>
            <User className="mr-2 h-4 w-4" />
            {country.active_on_nationalities ? (
              <>Deactivate for Nationalities</>
            ) : (
              <>Activate for Nationalities</>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleUniversityStatus}>
            <Globe className="mr-2 h-4 w-4" />
            {country.active_on_university ? (
              <>Deactivate for Universities</>
            ) : (
              <>Activate for Universities</>
            )}
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              country "{country.name}" and remove it from the database.
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
      <EditCountry
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        country={country}
        onRefresh={() => window.location.reload()}
      />
    </>
  );
}
