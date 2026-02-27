"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countriesService } from "@/modules/countries/services/countries-service";
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
  name: z.string().min(1, "Country name is required"),
  country_code: z.string().optional(),
  active_on_nationalities: z.boolean(),
  active_on_university: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface AddCountryProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function AddCountry({
  open = false,
  onOpenChange,
  onRefresh,
}: AddCountryProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      country_code: "",
      active_on_nationalities: true,
      active_on_university: true,
    },
  });

  // Handler for creating country
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Create country
      const countryData = {
        name: values.name,
        country_code: values.country_code,
        active_on_nationalities: values.active_on_nationalities,
        active_on_university: values.active_on_university,
      };

      await countriesService.createCountry(countryData);
      toast.success("Country created successfully");

      // Close dialog and refresh country list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error creating country:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create country"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Country</DialogTitle>
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
                  <FormLabel>Country Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. US" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="active_on_nationalities"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active for Nationalities</FormLabel>
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

              <FormField
                control={form.control}
                name="active_on_university"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active for Universities</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Country"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
