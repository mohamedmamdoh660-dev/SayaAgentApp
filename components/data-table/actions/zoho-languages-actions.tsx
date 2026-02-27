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
import { ZohoLanguage } from "@/types/types";
import { zohoLanguagesService } from "@/modules/zoho-languages/services/zoho-languages-service";
import EditZohoLanguage from "@/components/(main)/zoho-languages/edit-zoho-language";
import DeleteZohoLanguage from "@/components/(main)/zoho-languages/delete-zoho-language";
import { Edit, Ellipsis, Trash } from "lucide-react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  fetchLanguages: () => void;
}

export function ZohoLanguagesTableRowActions<TData>({
  row,
  fetchLanguages,
}: DataTableRowActionsProps<TData>) {
  const language = row.original as ZohoLanguage;
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

      <EditZohoLanguage
        language={language}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onRefresh={fetchLanguages}
      />

      <DeleteZohoLanguage
        language={language}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onRefresh={fetchLanguages}
      />
    </>
  );
}
