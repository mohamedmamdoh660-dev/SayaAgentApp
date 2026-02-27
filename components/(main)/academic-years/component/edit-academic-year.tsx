"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { academicYearsService } from "@/modules/academic-years/services/academic-years-service";
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
import { ZohoAcademicYear } from "@/types/types";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Academic year name is required"),
  active: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditAcademicYearProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  academicYear: ZohoAcademicYear;
}

export default function EditAcademicYear({
  open = false,
  onOpenChange,
  onRefresh,
  academicYear,
}: EditAcademicYearProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: academicYear.name || "",
      active: academicYear.active || false,
    },
  });

  // Update form values when academic year changes
  useEffect(() => {
    if (academicYear) {
      form.reset({
        name: academicYear.name || "",
        active: academicYear.active || false,
      });
    }
  }, [academicYear, form]);

  // Handler for updating academic year
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Update academic year
      const academicYearData = {
        name: values.name,
        active: values.active,
      };

      await academicYearsService.updateAcademicYear(
        academicYear.id,
        academicYearData
      );
      toast.success("Academic year updated successfully");

      // Close dialog and refresh academic year list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating academic year:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update academic year"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Academic Year</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2023-2024" {...field} />
                  </FormControl>
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
                    <FormLabel>Active</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Academic Year"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
