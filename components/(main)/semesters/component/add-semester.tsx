"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { semestersService } from "@/modules/semesters/services/semesters-service";
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

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Semester name is required"),
  active: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface AddSemesterProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function AddSemester({
  open = false,
  onOpenChange,
  onRefresh,
}: AddSemesterProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });

  // Handler for creating semester
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Create semester
      const semesterData = {
        name: values.name,
        active: values.active,
      };

      await semestersService.createSemester(semesterData);
      toast.success("Semester created successfully");

      // Close dialog and refresh semester list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error creating semester:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create semester"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
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
                  <FormLabel>Semester Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fall 2023" {...field} />
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
                {isLoading ? "Creating..." : "Create Semester"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
