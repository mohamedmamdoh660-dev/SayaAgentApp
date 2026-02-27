"use client";

import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ZohoFaculty } from "@/types/types";
import DeleteZohoFaculty from "@/components/(main)/zoho-faculty/delete-zoho-faculty";
import EditZohoFaculty from "@/components/(main)/zoho-faculty/edit-zoho-faculty";
import { Edit, Ellipsis, Trash } from "lucide-react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  fetchFaculties: () => void;
}

export function ZohoFacultyTableRowActions<TData>({
  row,
  fetchFaculties,
}: DataTableRowActionsProps<TData>) {
  const faculty = row.original as ZohoFaculty;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
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
            onClick={() => setIsDeleteDialogOpen(true)}
            className="cursor-pointer flex items-center"
          >
            <Trash className="mr-1 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditZohoFaculty
        faculty={faculty}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onRefresh={fetchFaculties}
      />

      <DeleteZohoFaculty
        faculty={faculty}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onRefresh={fetchFaculties}
      />
    </>
  );
}
