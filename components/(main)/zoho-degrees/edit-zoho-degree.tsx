"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zohoDegreesService } from "@/modules/zoho-degrees/services/zoho-degrees-service";
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
import { ZohoDegree } from "@/types/types";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Degree name is required"),
  code: z.string().optional(),
  active: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditZohoDegreeProps {
  degree: ZohoDegree;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function AddZohoDegree({
  open = false,
  onOpenChange,
  onRefresh,
  degree,
}: EditZohoDegreeProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      active: false,
    },
  });

  // Handler for creating degree
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Create degree
      await zohoDegreesService.updateDegree({
        id: degree.id,
        name: values.name,
        code: values.code,
        active: values.active,
      });
      toast.success("Degree updated successfully");

      // Close dialog and refresh degree list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error creating degree:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update degree"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (degree) {
      form.reset({
        name: degree.name || "",
        code: degree.code || "",
        active: degree.active || false,
      });
    }
  }, [degree, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Degree</DialogTitle>
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
                    <FormLabel>Degree Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter degree name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter degree code" {...field} />
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
                      <FormLabel> Status</FormLabel>
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
                {isLoading ? "Updating..." : "Update Degree"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
