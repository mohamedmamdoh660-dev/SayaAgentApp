"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zohoLanguagesService } from "@/modules/zoho-languages/services/zoho-languages-service";
import {
  Form,
  FormMessage,
  FormControl,
  FormLabel,
  FormItem,
  FormField,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZohoLanguage } from "@/types/types";

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Language name is required"),
});

type FormSchema = z.infer<typeof formSchema>;

interface EditZohoLanguageProps {
  language: ZohoLanguage;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function AddZohoLanguage({
  open = false,
  onOpenChange,
  onRefresh,
  language,
}: EditZohoLanguageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    try {
      await zohoLanguagesService.updateLanguage({
        id: language.id,
        name: values.name,
      });

      onOpenChange?.(false);
      onRefresh?.();
      resetForm();
    } catch (error) {
      console.error("Error creating language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
  };

  useEffect(() => {
    if (language) {
      form.reset({
        name: language.name || "",
      });
    }
  }, [language, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] pb-2 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Language</DialogTitle>
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
                    <FormLabel> Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter language name" {...field} />
                    </FormControl>
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
                {isLoading ? "Updating..." : "Update Language"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
