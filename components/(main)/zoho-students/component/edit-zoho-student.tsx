"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zohoStudentsService } from "@/modules/zoho-students/services/zoho-students-service";
import { updateStudentViaWebhook } from "@/lib/actions/zoho-students-actions";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ZohoStudent } from "@/types/types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableDropdown } from "@/components/searchable-dropdown";

// Define form validation schema
const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.string().optional(),
  date_of_birth: z.date().optional(),
  nationality: z.string().optional(),
  passport_number: z.string().optional(),
  passport_issue_date: z.date().optional(),
  passport_expiry_date: z.date().optional(),
  country_of_residence: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  mobile: z.string().optional(),
  father_name: z.string().optional(),
  father_mobile: z.string().optional(),
  father_job: z.string().optional(),
  mother_name: z.string().optional(),
  mother_mobile: z.string().optional(),
  mother_job: z.string().optional(),
});

interface EditZohoStudentProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  studentData?: ZohoStudent;
  fetchStudents: () => void;
}

export default function EditZohoStudent({
  open = false,
  onOpenChange,
  studentData,
  fetchStudents,
}: EditZohoStudentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dropdown] =
    useState<React.ComponentProps<typeof Calendar>["captionLayout"]>(
      "dropdown"
    );
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: studentData?.first_name || "",
      last_name: studentData?.last_name || "",
      gender: studentData?.gender || "",
      date_of_birth: studentData?.date_of_birth
        ? new Date(studentData.date_of_birth)
        : undefined,
      nationality: studentData?.nationality?.toString() || "",
      passport_number: studentData?.passport_number || "",
      passport_issue_date: studentData?.passport_issue_date
        ? new Date(studentData.passport_issue_date)
        : undefined,
      passport_expiry_date: studentData?.passport_expiry_date
        ? new Date(studentData.passport_expiry_date)
        : undefined,
      country_of_residence: studentData?.country_of_residence?.toString() || "",
      email: studentData?.email || "",
      mobile: studentData?.mobile || "",
      father_name: studentData?.father_name || "",
      father_mobile: studentData?.father_mobile || "",
      father_job: studentData?.father_job || "",
      mother_name: studentData?.mother_name || "",
      mother_mobile: studentData?.mother_mobile || "",
      mother_job: studentData?.mother_job || "",
    },
  });

  // Reset form when studentData changes
  useEffect(() => {
    if (studentData) {
      form.reset({
        first_name: studentData.first_name || "",
        last_name: studentData.last_name || "",
        gender: studentData.gender || "",
        date_of_birth: studentData.date_of_birth
          ? new Date(studentData.date_of_birth)
          : undefined,
        nationality: studentData.nationality?.toString() || "",
        passport_number: studentData.passport_number || "",
        passport_issue_date: studentData.passport_issue_date
          ? new Date(studentData.passport_issue_date)
          : undefined,
        passport_expiry_date: studentData.passport_expiry_date
          ? new Date(studentData.passport_expiry_date)
          : undefined,
        country_of_residence:
          studentData.country_of_residence?.toString() || "",
        email: studentData.email || "",
        mobile: studentData.mobile || "",
        father_name: studentData.father_name || "",
        father_mobile: studentData.father_mobile || "",
        father_job: studentData.father_job || "",
        mother_name: studentData.mother_name || "",
        mother_mobile: studentData.mother_mobile || "",
        mother_job: studentData.mother_job || "",
      });
    }
  }, [studentData, form]);

  // Handler for saving changes
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!studentData) return;

    setIsLoading(true);
    try {
      const updatedStudentData = {
        id: studentData.id,
        first_name: values.first_name,
        last_name: values.last_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth?.toISOString().split("T")[0],
        nationality: values.nationality
          ? values.nationality.toString()
          : undefined,
        passport_number: values.passport_number,
        passport_issue_date: values.passport_issue_date
          ?.toISOString()
          .split("T")[0],
        passport_expiry_date: values.passport_expiry_date
          ?.toISOString()
          .split("T")[0],
        country_of_residence: values.country_of_residence
          ? values.country_of_residence.toString()
          : undefined,
        email: values.email,
        mobile: values.mobile,
        father_name: values.father_name,
        father_mobile: values.father_mobile,
        father_job: values.father_job,
        mother_name: values.mother_name,
        mother_mobile: values.mother_mobile,
        mother_job: values.mother_job,
      };

      // First, call the n8n webhook
      const webhookResponse = await updateStudentViaWebhook(updatedStudentData);

      if (webhookResponse.status) {
        // If webhook was successful, then update in database
        await zohoStudentsService.updateStudent(updatedStudentData);
        toast.success("Student updated successfully");
        if (onOpenChange) onOpenChange(false);
        fetchStudents();
      } else {
        throw new Error(
          webhookResponse.message || "Failed to update student via webhook"
        );
      }
    } catch (error) {
      console.error("Error saving student data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update student"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Gender options
  const genders = ["Male", "Female", "Other"];

  // Custom Date Picker Component
  const DatePicker = ({
    field,
    placeholder,
  }: {
    field: any;
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value ? (
              format(field.value, "dd/MM/yyyy")
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value}
          onSelect={field.onChange}
          captionLayout={dropdown}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Student
          </DialogTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
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
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <DatePicker field={field} placeholder="Select date" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="Mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <SearchableDropdown
                        placeholder="Search nationality..."
                        table="zoho-countries"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        onSelect={(item: { id: string }) => {
                          field.onChange(item.id);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country_of_residence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Residence</FormLabel>
                      <SearchableDropdown
                        placeholder="Search country..."
                        table="zoho-countries"
                        searchField="name"
                        displayField="name"
                        initialValue={field.value}
                        onSelect={(item: { id: string }) => {
                          field.onChange(item.id);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Passport Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Passport Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="passport_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Passport number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passport_issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <DatePicker field={field} placeholder="Select date" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passport_expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <DatePicker field={field} placeholder="Select date" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Family Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Family Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="father_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="father_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="Father's mobile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="father_job"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Job</FormLabel>
                      <FormControl>
                        <Input placeholder="Father's job" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="mother_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mother's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mother_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="Mother's mobile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mother_job"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Job</FormLabel>
                      <FormControl>
                        <Input placeholder="Mother's job" {...field} />
                      </FormControl>
                      <FormMessage />
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
