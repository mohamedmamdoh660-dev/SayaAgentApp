"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zohoProgramsService } from "@/modules/zoho-programs/services/zoho-programs-service";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ZohoProgram } from "@/types/types";
import Image from "next/image";
import { SearchableDropdown } from "@/components/searchable-dropdown";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  faculty: z.string().optional(),
  speciality: z.string().optional(),
  degree: z.string().optional(),
  language: z.string().optional(),
  university: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  official_tuition: z.string().optional(),
  discounted_tuition: z.string().optional(),
  tuition_currency: z.string().optional(),
  active: z.boolean(),
  active_applications: z.boolean(),
  study_years: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditZohoProgramProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  programData?: ZohoProgram;
  fetchPrograms: () => void;
}

export default function EditZohoProgram({
  open = false,
  onOpenChange,
  programData,
  fetchPrograms,
}: EditZohoProgramProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: programData?.name || "",
      faculty: programData?.faculty_id?.toString() || "",
      speciality: programData?.speciality_id?.toString() || "",
      degree: programData?.degree_id?.toString() || "",
      language: programData?.language_id?.toString() || "",
      university: programData?.university_id?.toString() || "",
      city: programData?.city_id?.toString() || "",
      country: programData?.country_id?.toString() || "",
      official_tuition: programData?.official_tuition || "",
      discounted_tuition: programData?.discounted_tuition || "",
      tuition_currency: programData?.tuition_currency || "",
      active: programData?.active || false,
      active_applications: programData?.active_applications || false,
      study_years: programData?.study_years || "",
    },
  });

  // Reset form when programData changes
  useEffect(() => {
    if (programData) {
      form.reset({
        name: programData.name || "",
        faculty: programData.faculty_id?.toString() || "",
        speciality: programData.speciality_id?.toString() || "",
        degree: programData.degree_id?.toString() || "",
        language: programData.language_id?.toString() || "",
        university: programData.university_id?.toString() || "",
        city: programData.city_id?.toString() || "",
        country: programData.country_id?.toString() || "",
        official_tuition: programData.official_tuition || "",
        discounted_tuition: programData.discounted_tuition || "",
        tuition_currency: programData.tuition_currency || "",
        active: programData.active || false,
        active_applications: programData.active_applications || false,
        study_years: programData.study_years || "",
      });
    }
  }, [programData, form]);

  // Handler for saving changes
  const onSubmit = async (values: FormSchema) => {
    if (!programData) return;

    setIsLoading(true);
    try {
      // Update program
      const updatedProgramData = {
        id: programData.id,
        name: values.name,
        faculty: values.faculty ? parseInt(values.faculty) : undefined,
        speciality: values.speciality ? parseInt(values.speciality) : undefined,
        degree: values.degree ? parseInt(values.degree) : undefined,
        language: values.language ? parseInt(values.language) : undefined,
        university: values.university ? parseInt(values.university) : undefined,
        city: values.city ? parseInt(values.city) : undefined,
        country: values.country ? parseInt(values.country) : undefined,
        official_tuition: values.official_tuition,
        discounted_tuition: values.discounted_tuition,
        tuition_currency: values.tuition_currency,
        active: values.active,
        active_applications: values.active_applications,
        study_years: values.study_years,
      };

      await zohoProgramsService.updateProgram(updatedProgramData);
      toast.success("Program updated successfully");
      if (onOpenChange) onOpenChange(false);
      fetchPrograms();
    } catch (error) {
      console.error("Error saving program data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update program"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Currency options
  const currencies = ["USD", "EUR", "GBP", "AED"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Program</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter program name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <SearchableDropdown
                        placeholder="Search degree..."
                        table="zoho-degrees"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        // dependsOn={{
                        //   field: "faculty",
                        //   value: form.watch("faculty") || null
                        // }}
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <SearchableDropdown
                        placeholder="Search language..."
                        table="zoho-languages"
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

              <FormField
                control={form.control}
                name="study_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Years</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 4 years" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Location Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <SearchableDropdown
                        placeholder="Search country..."
                        table="zoho-countries"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          // Reset dependent fields
                          form.setValue("city", "");
                          form.setValue("university", "");
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
                        placeholder="Search city..."
                        table="zoho-cities"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        // dependsOn={{
                        //   field: "country",
                        //   value: form.watch("country") || null
                        // }}
                        disabled={!form.watch("country")}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          // Reset university when city changes
                          form.setValue("university", "");
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <SearchableDropdown
                      placeholder="Search University..."
                      table="zoho-universities"
                      searchField="name"
                      displayField="name"
                      initialValue={field.value?.toString() || ""}
                      // dependsOn={{
                      //   field: form.watch("city") ? "city" : "country",
                      //   value:
                      //     form.watch("city") || form.watch("country") || null,
                      // }}
                      onSelect={(item) => {
                        field.onChange(item.id);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Academic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty</FormLabel>
                      <SearchableDropdown
                        placeholder="Search faculty..."
                        table="zoho-faculties"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          // Reset speciality when faculty changes
                          form.setValue("speciality", "");
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speciality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speciality</FormLabel>
                      <SearchableDropdown
                        placeholder="Search speciality..."
                        table="zoho-specialities"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        // dependsOn={{
                        //   field: "faculty",
                        //   value: form.watch("faculty") || null
                        // }}
                        disabled={!form.watch("faculty")}
                        onSelect={(item) => {
                          field.onChange(item.id);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Financial Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="official_tuition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official Tuition</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discounted_tuition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discounted Tuition</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 8500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tuition_currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Status Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Program Active</FormLabel>
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
                  name="active_applications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Applications Open</FormLabel>
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
