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

import { SearchableDropdown } from "@/components/searchable-dropdown";
import { useAuth } from "@/context/AuthContext";

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

interface AddZohoProgramProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function AddZohoProgram({
  open = false,
  onOpenChange,
  onRefresh,
}: AddZohoProgramProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      faculty: "",
      speciality: "",
      degree: "",
      language: "",
      university: "",
      city: "",
      country: "",
      official_tuition: "",
      discounted_tuition: "",
      tuition_currency: "",
      active: false,
      active_applications: false,
      study_years: "",
    },
  });

  // Handler for creating program
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Create program
      const programData = {
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
        user_id: userProfile?.id,
      };

      await zohoProgramsService.createProgram(programData);
      toast.success("Program created successfully");

      // Close dialog and refresh program list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error creating program:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create program"
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
          <DialogTitle>Add New Program</DialogTitle>
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
                        placeholder="Select Degree..."
                        table="zoho-degrees"
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <SearchableDropdown
                        placeholder="Select Language..."
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
                        placeholder="Select Country..."
                        table="zoho-countries"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          // Reset dependent fields
                          // form.setValue("city", "");
                          // form.setValue("university", "");
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
                        // dependsOn={{
                        //   field: "country",
                        //   value: form.watch("country") || null,
                        // }}
                        // disabled={!form.watch("country")}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          // Reset university when city changes
                          // form.setValue("university", "");
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
                      placeholder="Select University..."
                      table="zoho-universities"
                      searchField="name"
                      displayField="name"
                      initialValue={field.value}
                      // dependsOn={{
                      //   field: form.watch("city") ? "city" : "country",
                      //   value:
                      //     form.watch("city") || form.watch("country") || null,
                      // }}
                      onSelect={(item) => {
                        field.onChange(item.id);
                      }}
                      renderItem={(item) => (
                        <div className="flex items-center gap-2">
                          {item.logo && (
                            <div className="w-5 h-5 relative overflow-hidden rounded-full bg-muted">
                              <div className="w-full h-full">
                                {typeof item.logo === "string" &&
                                  item.logo.startsWith("http") && (
                                    <div
                                      className="w-full h-full bg-cover bg-center"
                                      style={{
                                        backgroundImage: `url(${item.logo})`,
                                      }}
                                    />
                                  )}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.name}</div>
                          </div>
                        </div>
                      )}
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
                  name="speciality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speciality</FormLabel>
                      <SearchableDropdown
                        placeholder="Select Speciality..."
                        table="zoho-specialities"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        // dependsOn={{
                        //   field: "faculty",
                        //   value: form.watch("faculty") || null,
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
                {isLoading ? "Creating..." : "Create Program"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
