"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zohoCitiesService } from "@/modules/zoho-cities/services/zoho-cities-service";
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
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { ZohoCity, ZohoCountry } from "@/types/types";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "City name is required"),
  country: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditZohoCityProps {
  city: ZohoCity;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function EditZohoCity({
  city,
  open = false,
  onOpenChange,
  onRefresh,
}: EditZohoCityProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<ZohoCountry[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: city?.name || "",
      country: city?.country || "",
    },
  });

  // Reset form when city changes
  useEffect(() => {
    if (city) {
      form.reset({
        name: city.name || "",
        country: city.country || "",
      });
    }
  }, [city, form]);

  // Fetch countries when component mounts

  // Handler for saving changes
  const onSubmit = async (values: FormSchema) => {
    if (!city) return;

    setIsLoading(true);
    try {
      // Update city
      await zohoCitiesService.updateCity({
        id: city.id,
        name: values.name,
        country: values.country,
      });
      toast.success("City updated successfully");
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving city data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update city"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit City</DialogTitle>
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
                    <FormLabel>City Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <SearchableDropdown
                      placeholder="Select Country..."
                      table="zoho-countries"
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
