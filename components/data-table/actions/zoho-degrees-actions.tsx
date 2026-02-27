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
import { ZohoDegree } from "@/types/types";
import { zohoDegreesService } from "@/modules/zoho-degrees/services/zoho-degrees-service";
import EditZohoDegree from "@/components/(main)/zoho-degrees/edit-zoho-degree";
import DeleteZohoDegree from "@/components/(main)/zoho-degrees/delete-zoho-degree";
import { Edit, Ellipsis, Trash } from "lucide-react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  fetchDegrees: () => void;
}

export function ZohoDegreesTableRowActions<TData>({
  row,
  fetchDegrees,
}: DataTableRowActionsProps<TData>) {
  const degree = row.original as ZohoDegree;
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

      <EditZohoDegree
        degree={degree}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onRefresh={fetchDegrees}
      />

      <DeleteZohoDegree
        degree={degree}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onRefresh={fetchDegrees}
      />
    </>
  );
}
