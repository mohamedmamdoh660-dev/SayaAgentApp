"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApplicationViaWebhook } from "@/lib/actions/zoho-applications-actions";
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

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { useAuth } from "@/context/AuthContext";
import { ZohoAcademicYear, ZohoSemester } from "@/types/types";
import { zohoApplicationsService } from "@/modules";

// Define form validation schema
const formSchema = z.object({
  student: z.string().min(1, "Student is required"),
  program: z.string().min(1, "Program is required"),
  stage: z.string(),
  acdamic_year: z.string().optional(),
  semester: z.string().optional(),
  country: z.string().optional(),
  university: z.string().optional(),
  degree: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface AddZohoApplicationProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  presetStudentId?: string; // if provided, student will be preselected
  presetStudentName?: string; // display name when preset
  lockStudent?: boolean; // if true, student dropdown is disabled
}

export default function AddZohoApplication({
  open = false,
  onOpenChange,
  onRefresh,
  presetStudentId,
  presetStudentName,
  lockStudent = false,
}: AddZohoApplicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();
  const LOCATION = "add-application-form";
  const [academicYears, setAcademicYears] = useState<ZohoAcademicYear[]>([]);
  const [semesters, setSemesters] = useState<ZohoSemester[]>([]);
  const [studentName, setStudentName] = useState("");
  const [programName, setProgramName] = useState("");

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student: presetStudentId || "",
      program: "",
      stage: "pending review",
      acdamic_year: "",
      semester: "",
      country: "",
      university: "",
      degree: "",
    },
  });

  // Auto-assign default academic year and semester if available
  useEffect(() => {
    const loadLists = async () => {
      try {
        const [years, sems] = await Promise.all([
          zohoApplicationsService.getAcademicYears("", 0, 100),
          zohoApplicationsService.getSemesters("", 0, 100),
        ]);
        setAcademicYears(years);
        setSemesters(sems);

        // Assign defaults if empty
        if (!form.getValues("acdamic_year")) {
          const defYear = years.find((y: any) => y.is_default) || null;
          if (defYear) form.setValue("acdamic_year", defYear.id);
        }
        if (!form.getValues("semester")) {
          const defSem = sems.find((s: any) => s.is_default) || null;
          if (defSem) form.setValue("semester", defSem.id);
        }
      } catch (e) {
        // non-blocking
      }
    };
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      form.reset({
        student: presetStudentId || "",
        program: "",
        stage: "pending review",
        acdamic_year: "",
        semester: "",
        country: "",
        university: "",
        degree: "",
      });
      const academicYear = academicYears.find((y: any) => y.is_default) || null;
      const semester = semesters.find((s: any) => s.is_default) || null;
      form.setValue("acdamic_year", academicYear?.id || "");
      form.setValue("semester", semester?.id || "");
      if (presetStudentId) setStudentName(presetStudentName || "");
    }
  }, [open]);

  const RequiredStar = () => <span className="text-red-500 ml-0.5">*</span>;

  // Handler for creating application
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Create application
      const applicationData: any = {
        student: values.student || null,
        program: values.program || null,
        acdamic_year: values.acdamic_year || null,
        semester: values.semester || null,
        country: values.country || null,
        university: values.university || null,
        degree: values.degree || null,
        student_name: studentName.trim() || null,
        program_name: programName || null,
        user_id: userProfile?.id,
        agency_id:
          userProfile?.roles?.name === "agent"
            ? userProfile?.id
            : userProfile?.roles?.name === "admin"
              ? null
              : userProfile?.agency_id,
      };

      const found = await zohoApplicationsService.getapplicationBasedonFilter({
        student: { eq: values.student },
        program: { eq: values.program },
        acdamic_year: { eq: values.acdamic_year },
        semester: { eq: values.semester },
      });

      if (found.length > 0) {
        toast.error(
          "It looks like you've already submitted an application with the same details. If you need any help or have questions, please contact our support team."
        );
        return;
      }

      // First, call the n8n webhook
      const webhookResponse = await createApplicationViaWebhook({
        ...applicationData,
        crm_id: userProfile?.crm_id || userProfile?.agency?.crm_id || "",
      });

      if (webhookResponse.status) {
        // If webhook was successful, then create in database with the ID from webhook
        const applicationDataWithId = {
          ...applicationData,
          id: webhookResponse.id,
          stage: "pending review",
        };

        // @ts-ignore
        // await zohoApplicationsService.createApplication(applicationDataWithId);
        toast.success("Application created successfully");

        // Close dialog and refresh application list
        if (onOpenChange) onOpenChange(false);
        if (onRefresh) onRefresh();
      } else {
        throw new Error(
          webhookResponse.message || "Failed to create application via webhook"
        );
      }
    } catch (error) {
      console.error("Error creating application:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create application",
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
        </DialogHeader>
        <div className="">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="student"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>
                      Student <RequiredStar />
                    </FormLabel>
                    <SearchableDropdown
                      placeholder="Select Student..."
                      table="zoho-students"
                      searchField="first_name"
                      displayField="first_name"
                      displayField2="last_name"
                      initialValue={field.value?.toString() || ""}
                      disabled={lockStudent}
                      location={LOCATION}
                      onSelect={(item) => {
                        if (lockStudent) return;
                        field.onChange(item.id);
                        // @ts-ignore - item has first_name and last_name
                        setStudentName(
                          `${item.first_name || ""} ${item.last_name || ""}`
                        );
                      }}
                      renderItem={(item) => (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={generateNameAvatar(
                                item.first_name ||
                                  "" + " " + item.last_name ||
                                  ""
                              )}
                            />
                          </Avatar>
                          <span>
                            {item.first_name || ""} {item.last_name || ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.email}
                          </span>
                        </div>
                      )}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="acdamic_year"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Academic Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((y) => (
                            <SelectItem key={y.id} value={y.id}>
                              {y.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Semester</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {semesters.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Country</FormLabel>
                      <SearchableDropdown
                        placeholder="Select country..."
                        table="zoho-countries"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        bottom={false}
                        location={LOCATION}
                        onSelect={(item: { id: string }) => {
                          field.onChange(item.id);
                          // Reset dependent fields
                          form.setValue("university", "");
                          form.setValue("program", "");
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>University</FormLabel>
                      <SearchableDropdown
                        placeholder="Select university..."
                        table="zoho-universities"
                        searchField="name"
                        displayField="name"
                        label="University for Application"
                        initialValue={field.value}
                        bottom={false}
                        location={LOCATION}
                        dependsOn={[
                          {
                            field: "country",
                            value: form.watch("country") || null,
                          },
                        ]}
                        disabled={!form.watch("country")}
                        onSelect={(item: { id: string }) => {
                          field.onChange(item.id);
                          // Reset dependent fields
                          form.setValue("program", "");
                        }}
                        renderItem={(item: any) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Degree</FormLabel>
                      <SearchableDropdown
                        placeholder="Select degree..."
                        table="zoho-degrees"
                        searchField="name"
                        displayField="name"
                        bottom={false}
                        initialValue={field.value}
                        location={LOCATION}
                        onSelect={(item: { id: string }) => {
                          form.setValue("program", "");
                          field.onChange(item.id);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Program (depends on country, university, degree) */}
                <FormField
                  control={form.control}
                  name="program"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>
                        Program <RequiredStar />
                      </FormLabel>
                      <SearchableDropdown
                        placeholder="Select Program..."
                        table="zoho-programs"
                        searchField="name"
                        displayField="name"
                        bottom={false}
                        dependsOn={[
                          {
                            field: "university_id",
                            value: form.watch("university") || null,
                          },
                          {
                            field: "country_id",
                            value: form.watch("country") || null,
                          },
                          {
                            field: "degree_id",
                            value: form.watch("degree") || null,
                          },
                        ]}
                        disabled={
                          !form.watch("university") ||
                          !form.watch("country") ||
                          !form.watch("degree")
                        }
                        initialValue={field.value?.toString() || ""}
                        location={LOCATION}
                        onSelect={(item) => {
                          field.onChange(item.id);
                          // @ts-ignore - item has name
                          setProgramName(item.name);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange?.(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Application"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
