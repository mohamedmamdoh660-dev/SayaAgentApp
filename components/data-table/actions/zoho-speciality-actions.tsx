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
import { ZohoSpeciality } from "@/types/types";
import { zohoSpecialityService } from "@/modules/zoho-speciality/services/zoho-speciality-service";
import { Edit, Ellipsis, Trash } from "lucide-react";
import EditZohoSpeciality from "@/components/(main)/zoho-speciality/edit-zoho-speciality";
import DeleteZohoSpeciality from "@/components/(main)/zoho-speciality/delete-zoho-speciality";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  fetchSpecialities: () => void;
}

export function ZohoSpecialityTableRowActions<TData>({
  row,
  fetchSpecialities,
}: DataTableRowActionsProps<TData>) {
  const speciality = row.original as ZohoSpeciality;
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

      <EditZohoSpeciality
        speciality={speciality}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onRefresh={fetchSpecialities}
      />

      <DeleteZohoSpeciality
        speciality={speciality}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onRefresh={fetchSpecialities}
      />
    </>
  );
}
