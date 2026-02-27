"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zohoSpecialityService } from "@/modules/zoho-speciality/services/zoho-speciality-service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { ZohoSpeciality } from "@/types/types";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Speciality name is required"),
  faculty_id: z.string().optional(),
  active: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditZohoSpecialityProps {
  speciality: ZohoSpeciality;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function EditZohoSpeciality({
  speciality,
  open = false,
  onOpenChange,
  onRefresh,
}: EditZohoSpecialityProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: speciality?.name || "",
      faculty_id: speciality?.faculty_id || "",
      active: speciality?.active || false,
    },
  });

  // Reset form when speciality changes
  useEffect(() => {
    if (speciality) {
      form.reset({
        name: speciality.name || "",
        faculty_id: speciality.faculty_id || "",
        active: speciality.active || false,
      });
    }
  }, [speciality, form]);

  // Fetch faculties when component mounts

  // Handler for saving changes
  const onSubmit = async (values: FormSchema) => {
    if (!speciality) return;

    setIsLoading(true);
    try {
      // Update speciality
      await zohoSpecialityService.updateSpeciality({
        id: speciality.id,
        name: values.name,
        faculty_id: values.faculty_id,
        active: values.active,
      });
      toast.success("Speciality updated successfully");
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving speciality data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update speciality"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Speciality</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speciality Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter speciality name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faculty_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty</FormLabel>
                    <SearchableDropdown
                      placeholder="Select Faculty..."
                      table="zoho-faculties"
                      searchField="name"
                      displayField="name"
                      initialValue={field.value}
                      onSelect={(item) => {
                        field.onChange(item.id);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 ">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
