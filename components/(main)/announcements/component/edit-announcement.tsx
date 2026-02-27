"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { announcementsService } from "@/modules/announcements/services/announcements-service";
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
import { Textarea } from "@/components/ui/textarea";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { ANNOUNCEMENT_CATEGORIES, ZohoAnnouncement } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  university: z.string().optional(),
  program: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditAnnouncementDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  announcement: ZohoAnnouncement;
}

export default function EditAnnouncementDialog({
  open = false,
  onOpenChange,
  onRefresh,
  announcement,
}: EditAnnouncementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);

  // Initialize form
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: announcement.title || "",
      category: announcement.category || "General",
      description: announcement.description || "",
      university: announcement.university
        ? String(announcement.university)
        : "",
      program: announcement.program ? String(announcement.program) : "",
    },
  });

  // Update form values when announcement changes
  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title || "",
        category: announcement.category || "General",
        description: announcement.description || "",
        university: announcement.university
          ? String(announcement.university)
          : "",
        program: announcement.program ? String(announcement.program) : "",
      });
    }
  }, [announcement, form]);

  // Handler for updating announcement
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      // Update announcement
      const announcementData = {
        title: values.title,
        category: values.category,
        description: values.description,
        university: values.university ? values.university : null,
        program: values.program ? values.program : null,
      };

      await announcementsService.updateAnnouncement(
        announcement.id,
        announcementData
      );
      toast.success("Announcement updated successfully");

      // Close dialog and refresh announcement list
      if (onOpenChange) onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update announcement"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter programs based on selected university
  useEffect(() => {
    const universityId = form.watch("university");

    if (universityId) {
      const filtered = programs.filter(
        (program) => program.university === universityId
      );
      setFilteredPrograms(filtered);

      // Reset program if not in filtered list
      const programId = form.watch("program");
      if (
        programId &&
        filtered.length > 0 &&
        !filtered.some((program) => program.id === programId)
      ) {
        form.setValue("program", "");
      }
    } else {
      setFilteredPrograms(programs);
    }
  }, [form.watch("university"), programs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ANNOUNCEMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <div className="font-medium">{item.name}</div>
                        </div>
                      )}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <SearchableDropdown
                      placeholder="Select Program..."
                      table="zoho-programs"
                      searchField="name"
                      displayField="name"
                      initialValue={field.value}
                      dependsOn={[
                        {
                          field: "university",
                          value: form.watch("university") || null,
                        },
                      ]}
                      disabled={!form.watch("university")}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter announcement description"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                {isLoading ? "Updating..." : "Update Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
