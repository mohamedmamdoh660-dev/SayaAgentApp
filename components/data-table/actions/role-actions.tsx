"use client";
import React, { useState } from "react";
import { Ellipsis, Edit, Trash } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Role } from "@/modules/roles";
import ConfirmationDialogBox from "@/components/ui/confirmation-dialog-box";
import { rolesService } from "@/modules/roles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserRoles, ResourceType } from "@/types/types";
import {
  DeleteProtected,
  EditProtected,
} from "@/components/auth/permission-protected";

interface RoleTableRowActionsProps {
  row: Row<Role>;
  fetchRoles: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
});

export function RoleTableRowActions({
  row,
  fetchRoles,
}: RoleTableRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: "delete" | null;
  }>({ isOpen: false, action: null });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const values: Role = { ...row.original };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: values.name || "",
      description: values.description || "",
    },
  });

  const handleConfirmation = (action: "delete") => {
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
        await rolesService.deleteRole(values?.id);
        setConfirmationDialog({ isOpen: false, action: null });
        fetchRoles(); // Refresh the list after action
        toast.success(`Role Removed Successfully`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Unknown error");
    } finally {
      setLoading(false);
      setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await rolesService.updateRole(
        values.id,
        data.name,
        data.description || ""
      );
      setIsEditDialogOpen(false);
      fetchRoles();
      toast.success("Role updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update role");
    } finally {
      setLoading(false);
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
          <EditProtected resource={ResourceType.ROLES}>
            <DropdownMenuItem
              onClick={() => {
                setIsEditDialogOpen(true);
              }}
              className="cursor-pointer flex items-center"
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </EditProtected>
          <DeleteProtected resource={ResourceType.ROLES}>
            <DropdownMenuItem
              onClick={() => handleConfirmation("delete")}
              className="cursor-pointer flex items-center"
            >
              <Trash className="mr-1 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DeleteProtected>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter role name"
                        {...field}
                        disabled={values.name === UserRoles.ADMIN}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter role description"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialogBox
        title={`Are you sure you want to remove this role?`}
        description={`This action cannot be undone. This will permanently delete the selected role and all associated permissions.`}
        cancelText="Cancel"
        confirmText="Remove"
        isOpen={confirmationDialog.isOpen}
        setIsOpen={(isOpen: boolean) =>
          setConfirmationDialog((prev) => ({ ...prev, isOpen }))
        }
        loading={loading}
        onConfirm={onConfirm}
        icon={<Trash className="mr-2 h-4 w-4" />}
      />
    </>
  );
}
