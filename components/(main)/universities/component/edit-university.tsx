"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { universitiesService } from "@/modules/universities/services/universities-service";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ZohoUniversity } from "@/types/types";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "University name is required"),
  sector: z.string().optional(),
  acomodation: z.string().optional(),
  phone: z.string().optional(),
  wesbite: z.string().optional(),
  logo: z.string().optional(),
  profile_image: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditUniversityProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  university: ZohoUniversity;
}

export default function EditUniversity({
  open = false,
  onOpenChange,
  onRefresh,
  university,
}: EditUniversityProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: university.name || "",
      sector: university.sector || "",
      acomodation: university.acomodation || "",
      phone: university.phone || "",
      wesbite: university.wesbite || "",
      logo: university.logo || "",
      profile_image: university.profile_image || "",
      address: university.address || "",
      city: university.city ? String(university.city) : "",
      country: university.country ? String(university.country) : "",
    },
  });

  // Update form values when university changes
  useEffect(() => {
    if (university) {
      form.reset({
        name: university.name || "",
        sector: university.sector || "",
        acomodation: university.acomodation || "",
        phone: university.phone || "",
        wesbite: university.wesbite || "",
        logo: university.logo || "",
        profile_image: university.profile_image || "",
        address: university.address || "",
        city: university.city ? String(university.city) : "",
        country: university.country ? String(university.country) : "",
      });
    }
  }, [university, form]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const countriesData = await universitiesService.getCountries();
        setCountries(countriesData || []);

        // If university has a country, fetch its cities
        if (university.country) {
          const citiesData = await universitiesService.getCitiesByCountry(
            String(university.country)
          );
          setCities(citiesData || []);
        }
      } catch (error) {
        console.error("Error fetching reference data:", error);
        toast.error("Failed to load reference data");
      }
    };

    if (open) {
      fetchReferenceData();
    }
  }, [open, university.country]);

  // Watch country changes to load cities
  useEffect(() => {
    const countryId = form.watch("country");

    const fetchCities = async () => {
      if (countryId) {
        try {
          const citiesData =
            await universitiesService.getCitiesByCountry(countryId);
          setCities(citiesData || []);
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
      }
    };

    if (countryId && countryId !== String(university.country)) {
      fetchCities();
    }
  }, [form.watch("country"), university.country]);

  // Handler for updating university
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Update university
      const universityData = {
        name: values.name,
        sector: values.sector,
        acomodation: values.acomodation,
        phone: values.phone,
        wesbite: values.wesbite,
        logo: values.logo,
        profile_image: values.profile_image,
        address: values.address,
        city: values.city ? values.city : undefined,
        country: values.country ? values.country : undefined,
      };

      await universitiesService.updateUniversity(university.id, universityData);
      toast.success("University updated successfully");

      // Close dialog and refresh university list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating university:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update university"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit University</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter university name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Public, Private"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="wesbite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. www.university.edu"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acomodation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accommodation Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Details about accommodation options"
                          {...field}
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            // Reset city when country changes
                            form.setValue("city", "");
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <SearchableDropdown
                          placeholder="Select City..."
                          table="zoho-cities"
                          searchField="name"
                          displayField="name"
                          initialValue={field.value}
                          dependsOn={[
                            {
                              field: "country",
                              value: form.watch("country") || null,
                            },
                          ]}
                          disabled={!form.watch("country")}
                          onSelect={(item) => {
                            field.onChange(item.id);
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full address"
                          {...field}
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="URL to university logo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profile_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="URL to university profile image"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update University"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
