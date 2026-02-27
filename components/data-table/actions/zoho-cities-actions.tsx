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
import { ZohoCity } from "@/types/types";
import { zohoCitiesService } from "@/modules/zoho-cities/services/zoho-cities-service";
import EditZohoCity from "@/components/(main)/zoho-cities/edit-zoho-city";
import DeleteZohoCity from "@/components/(main)/zoho-cities/delete-zoho-city";
import { Edit, Ellipsis, Trash } from "lucide-react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  fetchCities: () => void;
}

export function ZohoCitiesTableRowActions<TData>({
  row,
  fetchCities,
}: DataTableRowActionsProps<TData>) {
  const city = row.original as ZohoCity;
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

      <EditZohoCity
        city={city}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onRefresh={fetchCities}
      />

      <DeleteZohoCity
        city={city}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onRefresh={fetchCities}
      />
    </>
  );
}
