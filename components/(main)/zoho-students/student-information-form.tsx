"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "@/styles/phone-input.css";
import { zohoStudentsService } from "@/modules/zoho-students/services/zoho-students-service";
import {
  createStudentViaWebhook,
  updateStudentViaWebhook,
} from "@/lib/actions/zoho-students-actions";
import { toast } from "sonner";
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
import { format } from "date-fns";
import {
  CalendarIcon,
  Upload,
  X,
  Plus,
  User,
  IdCard,
  Phone,
  GraduationCap,
  Image,
  FileText,
  Home,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { saveFile } from "@/supabase/actions/save-file";
import { useAuth } from "@/context/AuthContext";
import { ZohoCountry } from "@/types/types";
import { zohoProgramsService } from "@/modules/zoho-programs/services/zoho-programs-service";
import { formatFileSize } from "@/utils/format-file-size";
import moment from "moment-timezone";
import { getCountriesForTimezone } from "countries-and-timezones";
import { useDebounce } from "@/hooks/use-debounce";

// Enhanced form validation schema based on the images
const formSchema = z
  .object({
    // Basic student info
    transfer_student: z.enum(["yes", "no"], {
      required_error: "Transfer student is required",
    }),
    have_tc: z.enum(["yes", "no"]).optional(),
    tc_number: z.string().optional(),
    blue_card: z.enum(["yes", "no"], {
      required_error: "Blue card selection is required",
    }),

    // Personal Information
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    gender: z.enum(["Male", "Female", "Other"], {
      required_error: "Gender is required",
    }),
    date_of_birth: z.date({ required_error: "Date of birth is required" }),
    nationality: z.string().min(1, "Nationality is required"),
    passport_number: z.string().min(1, "Passport number is required"),
    passport_issue_date: z.date({ required_error: "Issue date is required" }),
    passport_expiry_date: z.date({ required_error: "Expiry date is required" }),
    student_id: z.string().optional(),

    // Contact Information
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address"),
    mobile: z.string().min(8, "Mobile number must be at least 8 digits"),

    // Address Information
    address_line_1: z.string().optional(),
    city_district: z.string().optional(),
    state_province: z.string().optional(),
    postal_code: z.string().optional(),
    address_country: z.string().optional(),

    // Parent Information
    father_name: z.string().min(1, "Father name is required"),
    father_mobile: z.string().optional(),
    father_occupation: z.string().optional(),
    mother_name: z.string().optional(),
    mother_mobile: z.string().optional(),
    mother_occupation: z.string().optional(),

    // Education Information
    education_level: z.string().optional(),
    education_level_name: z.string().optional(),

    // High School Information
    high_school_country: z.string().optional(),
    high_school_name: z.string().optional(),
    high_school_gpa_percent: z.string().optional(),

    // Bachelor Information (for Master/Phd applicants)
    bachelor_school_name: z.string().optional(),
    bachelor_country: z.string().optional(),
    bachelor_gpa_percent: z.string().optional(),

    // Master Information (for Phd applicants)
    master_school_name: z.string().optional(),
    master_country: z.string().optional(),
    master_gpa_percent: z.string().optional(),

    // Photo
    photo: z.any().optional(),

    // Documents
    documents: z
      .array(
        z.object({
          attachment_type: z.string(),
          file: z.any(),
        })
      )
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.passport_issue_date &&
      val.passport_expiry_date &&
      val.passport_expiry_date < val.passport_issue_date
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passport_expiry_date"],
        message: "Expiry date cannot be before issue date",
      });
    }

    if (val.date_of_birth) {
      const today = new Date();
      const minAgeDate = new Date(
        today.getFullYear() - 15,
        today.getMonth(),
        today.getDate()
      );
      if (val.date_of_birth > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["date_of_birth"],
          message: "Date of birth cannot be in the future",
        });
      }
      if (val.date_of_birth > minAgeDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["date_of_birth"],
          message: "Student must be at least 15 years old",
        });
      }
    }

    // Require TC number when have_tc is yes
    if (
      val.have_tc === "yes" &&
      (!val.tc_number || val.tc_number.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tc_number"],
        message: "T.C. number is required when T.C is selected",
      });
    }
  });

interface StudentInformationFormProps {
  mode: "create" | "edit";
}

export default function StudentInformationForm({
  mode,
}: StudentInformationFormProps) {
  const params = useParams();
  const studentId = params.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<
    Array<{
      attachment_type: string;
      file: File | null;
      uploading: boolean;
      size: number;
      url?: string;
    }>
  >([{ attachment_type: "", file: null, uploading: false, size: 0 }]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [dropdown] =
    useState<React.ComponentProps<typeof Calendar>["captionLayout"]>(
      "dropdown"
    );
  const { userProfile } = useAuth();

  const [contries, setContries] = useState<ZohoCountry[]>([]);
  const [defaultPhoneCountry, setDefaultPhoneCountry] = useState<string>("");
  // Initialize form
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transfer_student: "no",
      have_tc: "no",
      tc_number: "",
      blue_card: "no",
      first_name: "",
      last_name: "",
      gender: undefined,
      date_of_birth: undefined,
      nationality: "",
      passport_number: "",
      passport_issue_date: undefined,
      passport_expiry_date: undefined,
      country_of_residence: "",
      student_id: "",
      email: "",
      mobile: "",
      address_line_1: "",
      city_district: "",
      state_province: "",
      postal_code: "",
      address_country: "",
      father_name: "",
      father_mobile: "",
      father_occupation: "",
      mother_name: "",
      mother_mobile: "",
      mother_occupation: "",
      education_level: "",
      education_level_name: "",
      high_school_country: "",
      high_school_name: "",
      high_school_gpa_percent: "",
      bachelor_school_name: "",
      bachelor_country: "",
      bachelor_gpa_percent: "",
      master_school_name: "",
      master_country: "",
      master_gpa_percent: "",
      photo: null,
      documents: [],
    },
  });

  const loadStudentData = useCallback(async () => {
    try {
      setIsLoading(true);
      const student = await zohoStudentsService.getStudentById(studentId!);
      if (student) {
        // Populate form with existing data
        form.reset({
          first_name: student.first_name || "",
          last_name: student.last_name || "",
          gender: student.gender || undefined,
          date_of_birth: student.date_of_birth
            ? new Date(student.date_of_birth)
            : undefined,
          nationality: student.nationality || "",
          passport_number: student.passport_number || "",
          passport_issue_date: student.passport_issue_date
            ? new Date(student.passport_issue_date)
            : undefined,
          passport_expiry_date: student.passport_expiry_date
            ? new Date(student.passport_expiry_date)
            : undefined,
          country_of_residence: student.country_of_residence || "",
          email: student.email || "",
          mobile: student.mobile || "",
          father_name: student.father_name || "",
          father_mobile: student.father_mobile || "",
          father_occupation: student.father_job || "",
          mother_name: student.mother_name || "",
          mother_mobile: student.mother_mobile || "",
          mother_occupation: student.mother_job || "",
          education_level: student.education_level || "",
          education_level_name: student.education_level_name || "",
          high_school_country: student.high_school_country || "",
          high_school_name: student.high_school_name || "",
          high_school_gpa_percent: student.high_school_gpa_percent || "",
          bachelor_school_name: student.bachelor_school_name || "",
          bachelor_country: student.bachelor_country || "",
          bachelor_gpa_percent: student.bachelor_gpa_percent || "",
          master_school_name: student.master_school_name || "",
          master_country: student.master_country || "",
          master_gpa_percent: student.master_gpa_percent || "",
          have_tc: student.have_tc === "Yes" ? "yes" : "no",
          tc_number: student.tc_number || "",
          blue_card: student.blue_card === "Yes" ? "yes" : "no",
          student_id: student.student_id || "",
          transfer_student: student.transfer_student === "Yes" ? "yes" : "no",
          address_line_1: student.address_line_1 || "",
          city_district: student.city_district || "",
          state_province: student.state_province || "",
          postal_code: student.postal_code || "",
          address_country: student.address_country || "",
          photo_url: student.photo_url || "",
        });
      }

      const documents = JSON.parse(student.documents || "[]");
      setDocuments(
        documents.map((doc: any) => ({
          attachment_type: doc.type,
          file: doc.url ? new File([], doc.filename) : null,
          uploading: false,
          url: doc.url,
          size: doc.size,
        }))
      );
      setPhotoUrl(student.photo_url || "");

      setTimeout(() => {
        form.setValue("nationality", student.nationality || "");
        form.setValue("address_country", student.address_country || "");
      }, 4000);
    } catch (error) {
      console.error("Error loading student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setIsLoading(false);
    }
  }, [form, studentId]);

  function getCountryFromTimezone(timezone: string) {
    const countries = getCountriesForTimezone(timezone);
    return countries.length > 0 ? countries[0].id : "Unknown";
  }
  // Load student data for edit mode
  useEffect(() => {
    if (mode === "edit" && studentId) {
      loadStudentData();
    }
  }, [mode, studentId, loadStudentData]);

  // Handler for form submission
  const onSubmit = async (values: any) => {
    setIsLoading(true);

    try {
      // Validate required documents: at least one Passport and one HighSchool Transcript
      const hasPassport = documents.some(
        (d) => d.attachment_type?.toLowerCase() === "passport" && d.url
      );
      const hasTranscript = documents.some(
        (d) =>
          d.attachment_type?.toLowerCase() === "highschool transcript" && d.url
      );
      if (!hasPassport || !hasTranscript) {
        setIsLoading(false);
        toast.error(
          "Please upload at least one Passport and one HighSchool Transcript"
        );
        return;
      }

      // Prepare documents data - passing URLs instead of file objects
      const documentsData = documents
        .filter((doc) => doc.attachment_type && doc.url)
        .map((doc) => ({
          type: doc.attachment_type,
          url: doc.url,
          filename: doc.file?.name || "",
          size: doc.file?.size || doc.size,
        }));

      // Data for webhook - include ALL fields and files from every section
      const webhookStudentData = {
        // Student Basic Info Card
        transfer_student: values.transfer_student === "yes" ? "Yes" : "No",
        have_tc: values.have_tc === "yes" ? "Yes" : "No",
        blue_card: values.blue_card === "yes" ? "Yes" : "No",
        tc_number: values.have_tc === "yes" ? values.tc_number || null : null,

        // Personal Details
        first_name: values.first_name,
        last_name: values.last_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth
          ? new Date(values.date_of_birth).toISOString().split("T")[0]
          : null,
        nationality: values.nationality ? values.nationality.toString() : null,
        passport_number: values.passport_number,
        passport_issue_date: values.passport_issue_date
          ? new Date(values.passport_issue_date).toISOString().split("T")[0]
          : null,
        passport_expiry_date: values.passport_expiry_date
          ? new Date(values.passport_expiry_date).toISOString().split("T")[0]
          : null,

        // Contact & Address Information
        email: values.email,
        mobile: values.mobile.length < 5 ? null : values.mobile,
        address_line_1: values.address_line_1?.replace(/\n/g, " "),
        city_district: values.city_district,
        state_province: values.state_province,
        postal_code: values.postal_code,
        address_country: values.address_country || null,

        // Family Information
        father_name: values.father_name,
        father_mobile:
          values.father_mobile.length < 5 ? null : values.father_mobile,
        father_job: values.father_occupation,
        mother_name: values.mother_name,
        mother_mobile:
          values.mother_mobile.length < 5 ? null : values.mother_mobile,
        mother_job: values.mother_occupation,

        // Academic Information
        education_level: values.education_level || null,
        education_level_name: values.education_level_name,

        // High School
        high_school_country: values.high_school_country || null,
        high_school_name: values.high_school_name,
        high_school_gpa_percent: Number(values.high_school_gpa_percent),

        // Bachelor (if provided)
        bachelor_school_name: values.bachelor_school_name,
        bachelor_country: values.bachelor_country || null,
        bachelor_gpa_percent: Number(values.bachelor_gpa_percent),

        // Master (if provided)
        master_school_name: values.master_school_name,
        master_country: values.master_country || null,
        master_gpa_percent: Number(values.master_gpa_percent),

        // Photo Upload
        photo_url: values.photo, // Pass the URL instead of file

        // Documents
        documents: documentsData,
        user_id: userProfile?.id,
        agency_id:
          userProfile?.roles?.name === "agent"
            ? userProfile?.id
            : userProfile?.roles?.name === "admin"
              ? null
              : userProfile?.agency_id,
        crm_id: userProfile?.crm_id || userProfile?.agency?.crm_id || "",
      };

      if (mode === "create") {
        // Create new student
        const webhookResponse =
          await createStudentViaWebhook(webhookStudentData);
        if (webhookResponse.status) {
          const studentDataWithId = {
            ...webhookStudentData,
            id: webhookResponse.id,
            // id: Math.random().toString(36).substring(2, 15),
            user_id: userProfile?.id,
            agency_id:
              userProfile?.roles?.name === "agent"
                ? userProfile?.id
                : userProfile?.roles?.name === "admin"
                  ? null
                  : userProfile?.agency_id,
            documents: JSON.stringify(documentsData),
          };
          // @ts-ignore
          // await zohoStudentsService.createStudent(studentDataWithId);
          toast.success("Student created successfully");
          router.push("/students");
          // throw new Error("Student created successfully");
        } else {
          throw new Error(
            webhookResponse.message || "Failed to create student via webhook"
          );
        }
      } else {
        // Update existing student
        const webhookResponse = await updateStudentViaWebhook({
          id: studentId,
          ...webhookStudentData,
        });

        if (webhookResponse.status) {
          await zohoStudentsService.updateStudent({
            id: studentId,
            ...webhookStudentData, // Only update the fields we're already passingd
            documents: JSON.stringify(documentsData),
          });
          toast.success("Student updated successfully");
          router.push("/students");
        } else {
          throw new Error(
            webhookResponse.message || "Failed to update student via webhook"
          );
        }
      }
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} student:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${mode === "create" ? "create" : "update"} student`,
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Document attachment types
  const attachmentTypes = [
    "Passport",
    "HighSchool Transcript",
    "Diploma",
    "English Skills",
    "Motivation Letter",
    "Recommendation Letter",
  ];

  // Gender options
  const genders = ["Male", "Female"];

  const RequiredStar = () => <span className="text-red-500 ml-0.5">*</span>;

  // Custom Date Picker Component
  const DatePicker = ({
    field,
    placeholder,
    label,
  }: {
    field: any;
    placeholder: string;
    label: string;
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
              format(field.value, "yyyy-MM-dd")
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
          captionLayout="dropdown"
          fromYear={label === "Expiry Date" ? 2000 : undefined}
          toYear={label === "Expiry Date" ? 2090 : undefined}
          disabled={(date) => {
            // Only apply date restrictions when it's not an expiry date field
            if (label !== "Expiry Date") {
              const today = new Date();
              const minAgeDate = new Date(
                today.getFullYear() - 15,
                today.getMonth(),
                today.getDate()
              );
              // For Date of Birth, enforce at least 15 years old
              if (label === "Date of Birth") {
                return date > minAgeDate || date < new Date("1900-01-01");
              }
              return date > today || date < new Date("1900-01-01");
            }
            // For expiry dates, restrict to years 2000-2090 and after Issue Date
            const issueDate = form.getValues("passport_issue_date") as
              | Date
              | undefined;
            const lowerBound = new Date("2000-01-01");
            const upperBound = new Date("2090-12-31");
            const minDate =
              issueDate && issueDate > lowerBound ? issueDate : lowerBound;
            return date < minDate || date > upperBound;
          }}
          initialFocus
          defaultMonth={
            label === "Date of Birth" ? new Date(2000, 0, 1) : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );

  // Handle photo upload
  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be less than 5MB");
      return;
    }

    // Check file type
    const allowedPhotoTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
    ];
    if (!allowedPhotoTypes.includes(file.type)) {
      toast.error(
        "Please select a valid image file (JPG, JPEG, PNG, GIF, BMP)"
      );
      return;
    }

    setPhotoUploading(true);
    try {
      // Upload file to Supabase and get URL
      const url = await saveFile(file);
      if (url) {
        setPhotoUrl(url);
        form.setValue("photo", url); // Store URL instead of file
        toast.success("Photo uploaded successfully");
      } else {
        toast.error("Failed to upload photo");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Add new document row
  const addDocumentRow = () => {
    setDocuments([
      ...documents,
      { attachment_type: "", file: null, uploading: false, size: 0 },
    ]);
  };

  // Remove document row
  const removeDocumentRow = (index: number) => {
    if (documents.length > 1) {
      const newDocs = documents.filter((_, i) => i !== index);
      setDocuments(newDocs);
    }
  };

  // Handle document type change
  const handleDocumentTypeChange = (index: number, type: string) => {
    const newDocs = [...documents];
    newDocs[index].attachment_type = type;
    setDocuments(newDocs);
  };

  // Handle document file upload
  const handleDocumentUpload = async (index: number, file: File | null) => {
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document size must be less than 5MB");
      return;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please select a valid document file (PDF, DOC, DOCX, JPG, PNG)"
      );
      return;
    }

    const newDocs = [...documents];
    if (!newDocs[index].attachment_type) {
      toast.error("Please select a document type first");
      return;
    }
    newDocs[index].uploading = true;
    setDocuments([...newDocs]);

    try {
      // Upload file to Supabase and get URL
      const url = await saveFile(file);
      if (url) {
        newDocs[index].file = file; // Keep file for reference
        newDocs[index].url = url; // Store the actual Supabase URL
        newDocs[index].uploading = false;
        setDocuments([...newDocs]);
        toast.success(`${file.name} uploaded successfully`);
      } else {
        newDocs[index].uploading = false;
        setDocuments([...newDocs]);
        toast.error("Failed to upload document");
      }
    } catch (error) {
      console.error("Document upload error:", error);
      newDocs[index].uploading = false;
      setDocuments([...newDocs]);
      toast.error("Failed to upload document");
    }
  };

  useEffect(() => {
    const getTimezone = async () => {
      const timezone = moment.tz.guess();
      const countryCode = getCountryFromTimezone(timezone);
      setDefaultPhoneCountry(countryCode.toLocaleLowerCase() || "ae");
    };

    const fetchCountries = async () => {
      const countries = await zohoProgramsService.getCountries(
        "",
        0,
        1000,
        null
      );
      setContries(countries);
    };

    getTimezone();
    fetchCountries();
  }, []);

  // Reset dependent degree fields when degree is changed to a lower level
  const watchedEducationLevelName = (form.watch("education_level_name") || "")
    .toString()
    .toLowerCase();

  useEffect(() => {
    const levelName = watchedEducationLevelName;
    // Always clear when changing to lower than master
    if (levelName !== "master" && levelName !== "phd") {
      form.setValue("bachelor_school_name", "");
      form.setValue("bachelor_country", "");
      form.setValue("bachelor_gpa_percent", "");
    }
    // Clear master fields unless explicit phd
    if (levelName !== "phd") {
      form.setValue("master_school_name", "");
      form.setValue("master_country", "");
      form.setValue("master_gpa_percent", "");
    }
  }, [watchedEducationLevelName, form]);

  // Keep expiry date consistent when issue date changes
  const watchedIssueDate = form.watch("passport_issue_date") as
    | Date
    | undefined;
  const watchedExpiryDate = form.watch("passport_expiry_date") as
    | Date
    | undefined;
  useEffect(() => {
    if (
      watchedIssueDate &&
      watchedExpiryDate &&
      watchedExpiryDate < watchedIssueDate
    ) {
      form.setValue("passport_expiry_date", undefined, {
        shouldValidate: true,
      });
      form.trigger("passport_expiry_date");
    }
  }, [watchedIssueDate, watchedExpiryDate, form]);

  // Debounced validation for email and passport_number
  const watchedEmail = form.watch("email");
  const watchedPassportNumber = form.watch("passport_number");
  const debouncedEmail = useDebounce(watchedEmail, 800);
  const debouncedPassportNumber = useDebounce(watchedPassportNumber, 800);

  // Check for duplicate email
  useEffect(() => {
    const checkEmailDuplicate = async () => {
      if (!debouncedEmail || debouncedEmail.trim() === "") {
        form.clearErrors("email");
        return;
      }

      // Basic email format validation first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(debouncedEmail)) {
        // Let zod handle format validation
        return;
      }

      try {
        const excludeId = mode === "edit" ? studentId : undefined;
        const isDuplicate = await zohoStudentsService.checkDuplicateEmail(
          debouncedEmail,
          excludeId
        );

        if (isDuplicate) {
          form.setError("email", {
            type: "manual",
            message: "This email is already registered",
          });
          toast.error("This email is already in use", {
            description: "Please enter a different email address",
          });
        } else {
          // Clear error if email is valid and not duplicate
          form.clearErrors("email");
        }
      } catch (error) {
        console.error("Error checking duplicate email:", error);
      }
    };

    checkEmailDuplicate();
  }, [debouncedEmail, form, mode, studentId]);

  // Check for duplicate passport number
  useEffect(() => {
    const checkPassportDuplicate = async () => {
      if (!debouncedPassportNumber || debouncedPassportNumber.trim() === "") {
        form.clearErrors("passport_number");
        return;
      }

      try {
        const excludeId = mode === "edit" ? studentId : undefined;
        const isDuplicate = await zohoStudentsService.checkDuplicatePassport(
          debouncedPassportNumber,
          excludeId
        );

        if (isDuplicate) {
          form.setError("passport_number", {
            type: "manual",
            message: "This passport is already in use",
          });
          toast.error("This passport is already in use", {
            description: "Please enter a different passport number",
          });
        } else {
          // Clear error if passport is valid and not duplicate
          form.clearErrors("passport_number");
        }
      } catch (error) {
        console.error("Error checking duplicate passport:", error);
      }
    };

    checkPassportDuplicate();
  }, [debouncedPassportNumber, form, mode, studentId]);

  return (
    <div className="space-y-6">
      {isLoading && mode === "create" && (
        <div className="fixed inset-0  flex items-center justify-center bg-black/50 backdrop-blur-sm mb-[0px] z-[25]">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg max-w-sm">
            {/* Simple spinner */}
            <Loader2 className="h-8 w-8 animate-spin text-primary" />

            {/* Clean text */}
            <div className="text-center space-y-2">
              <p className="text-[18px] font-medium">Creating student…</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we save the information.
              </p>
            </div>
          </div>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Basic Info Card */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-primary" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Radio button questions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="transfer_student"
                  render={({ field }) => (
                    <FormItem className="gap-5 flex flex-col">
                      <FormLabel>Transfer student?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="transfer-yes" />
                            <Label htmlFor="transfer-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="transfer-no" />
                            <Label htmlFor="transfer-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="have_tc"
                    render={({ field }) => (
                      <FormItem className="gap-5">
                        <FormLabel>Have T.C</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value !== "yes") {
                                form.setValue("tc_number", "");
                              }
                            }}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="tc-yes" />
                              <Label htmlFor="tc-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="tc-no" />
                              <Label htmlFor="tc-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("have_tc") === "yes" && (
                    <FormField
                      control={form.control}
                      name="tc_number"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <Input placeholder="Enter T.C. number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="blue_card"
                  render={({ field }) => (
                    <FormItem className="gap-5 flex flex-col">
                      <FormLabel>Blue Card</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="blue-yes" />
                            <Label htmlFor="blue-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="blue-no" />
                            <Label htmlFor="blue-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Details Card */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard size={20} className="text-primary" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        First Name <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Last Name <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Gender <RequiredStar />
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-Select-" />
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
                  name="passport_number"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Passport No <RequiredStar />
                      </FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Issue Date <RequiredStar />
                      </FormLabel>
                      <DatePicker
                        field={field}
                        placeholder="yyyy-MM-dd"
                        label="Issue Date"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passport_expiry_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Expiry Date <RequiredStar />
                      </FormLabel>
                      <DatePicker
                        field={field}
                        placeholder="yyyy-MM-dd"
                        label="Expiry Date"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Date of Birth <RequiredStar />
                      </FormLabel>
                      <DatePicker
                        field={field}
                        placeholder="yyyy-MM-dd"
                        label="Date of Birth"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Nationality <RequiredStar />
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-Select-" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contries
                            .filter(
                              (country) =>
                                country.active_on_nationalities === true
                            )
                            .map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Address Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone size={20} className="text-primary" />
                Contact & Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Email <RequiredStar />
                      </FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Mobile <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        {defaultPhoneCountry && (
                          <PhoneInput
                            defaultCountry={defaultPhoneCountry as any}
                            value={field.value}
                            onChange={(phone: any) => field.onChange(phone)}
                            placeholder="Enter mobile number"
                            inputClassName="h-11 rounded-md px-3 text-sm w-full"
                          />
                        )}
                        {/* <Input placeholder="Mobile number" {...field} /> */}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Home size={16} className="text-muted-foreground" />
                  Address
                </h4>

                <FormField
                  control={form.control}
                  name="address_line_1"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Address Line 1"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city_district"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>City / District</FormLabel>
                        <FormControl>
                          <Input placeholder="City / District" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state_province"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>State / Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State / Province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Postal Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address_country"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="-Select-" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
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

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users size={16} className="text-muted-foreground" />
                  Family Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="father_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Father_Name <RequiredStar />
                        </FormLabel>
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Father Mobile</FormLabel>
                        <FormControl>
                          {defaultPhoneCountry && (
                            <PhoneInput
                              defaultCountry={defaultPhoneCountry as any}
                              value={field.value}
                              onChange={(phone: any) => field.onChange(phone)}
                              placeholder="Enter mobile number"
                              inputClassName="h-11 rounded-md px-3 text-sm w-full"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="father_occupation"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Father Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Father's occupation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mother_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Mother Name</FormLabel>
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Mother Mobile</FormLabel>
                        <FormControl>
                          {defaultPhoneCountry && (
                            <PhoneInput
                              defaultCountry={defaultPhoneCountry as any}
                              value={field.value}
                              onChange={(phone: any) => field.onChange(phone)}
                              placeholder="Enter mobile number"
                              inputClassName="h-11 rounded-md px-3 text-sm w-full"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mother_occupation"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Mother Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother's occupation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap size={20} className="text-primary" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="">
                <FormField
                  control={form.control}
                  name="education_level"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Student will apply for</FormLabel>
                      <SearchableDropdown
                        placeholder="Select Education Level..."
                        table="zoho-degrees"
                        searchField="name"
                        displayField="name"
                        bottom={false}
                        location={"student-information-form"}
                        initialValue={field.value}
                        onSelect={(item: { id: string; name?: string }) => {
                          field.onChange(item.id);
                          form.setValue(
                            "education_level_name",
                            item?.name || ""
                          );
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* High School Fields - always show */}

              {(form.watch("education_level_name") || "").trim() !== "" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="high_school_country"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>High School Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="-Select-" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contries.map((country) => (
                              <SelectItem key={country.id} value={country.name}>
                                {country.name}
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
                    name="high_school_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>High School Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter high school name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="high_school_gpa_percent"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>High School GPA %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 3.5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {/* Conditional Bachelor fields for Master/Phd */}
              {(form.watch("education_level_name") || "").toLowerCase() ===
                "master" ||
              (form.watch("education_level_name") || "").toLowerCase() ===
                "phd" ? (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <GraduationCap
                      size={20}
                      className="text-muted-foreground"
                    />
                    Bachelor Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="bachelor_country"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Bachelor Country</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="-Select-" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contries.map((country) => (
                                <SelectItem
                                  key={country.id}
                                  value={country.name}
                                >
                                  {country.name}
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
                      name="bachelor_school_name"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Bachelor School Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter bachelor school"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bachelor_gpa_percent"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Bachelor GPA %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 3.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : null}

              {/* Conditional Master fields for Phd */}
              {(form.watch("education_level_name") || "").toLowerCase() ===
              "phd" ? (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <GraduationCap
                      size={16}
                      className="text-muted-foreground"
                    />
                    Master Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="master_country"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Master Country</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="-Select-" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contries.map((country) => (
                                <SelectItem
                                  key={country.id}
                                  value={country.name}
                                >
                                  {country.name}
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
                      name="master_school_name"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Master School Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter master school"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="master_gpa_percent"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Master GPA %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 3.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Photo Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image size={20} className="text-primary" />
                Photo Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormControl>
                      <div className="space-y-4">
                        {photoUrl && (
                          <div className="flex items-center justify-center">
                            <img
                              src={photoUrl}
                              alt="Student photo"
                              className="w-32 h-32 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                        <div
                          className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors w-full cursor-pointer"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept =
                              "image/jpg, image/jpeg, image/png, image/gif, image/bmp";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement)
                                .files?.[0];
                              if (file) handlePhotoUpload(file);
                            };
                            input.click();
                          }}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={photoUploading}
                                className="flex items-center gap-2 w-[200px]"
                              >
                                {photoUploading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    Choose Image
                                    <Upload className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                              <p className="text-sm text-muted-foreground mt-2">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Document Attachments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Document Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="p-5 border-2 border-dashed rounded-lg bg-muted/10 space-y-4  transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between ">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        Document {index + 1}
                      </h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentRow(index)}
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="w-full">
                        {/* <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                          Document Type
                        </label> */}
                        <Select
                          onValueChange={(value) =>
                            handleDocumentTypeChange(index, value)
                          }
                          value={doc.attachment_type}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {attachmentTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full">
                        {/* <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                          Document File
                        </label> */}
                        <div className="flex items-center gap-2">
                          {doc.file && doc.url ? (
                            <div className="flex flex-col w-full">
                              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900">
                                <div className="w-10 h-10 rounded-md bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 dark:text-green-300">
                                  <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-green-700 dark:text-green-300 truncate">
                                    {doc.file.name}
                                  </p>
                                  {(doc.file.size || doc.size) && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      {formatFileSize(
                                        doc.file.size || doc.size
                                      )}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(doc.url, "_blank")}
                                  className="h-8 px-2 text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50"
                                >
                                  View
                                </Button>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-xs self-end"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept =
                                    ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement)
                                      .files?.[0];
                                    if (file) handleDocumentUpload(index, file);
                                  };
                                  input.click();
                                }}
                              >
                                Replace file
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors w-full cursor-pointer"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept =
                                  ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement)
                                    .files?.[0];
                                  if (file) handleDocumentUpload(index, file);
                                };
                                input.click();
                              }}
                            >
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="w-full flex flex-col items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={doc.uploading}
                                    className="flex items-center gap-2 w-[200px]"
                                  >
                                    {doc.uploading ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        Choose Document
                                        <Upload className="h-4 w-4" />
                                      </>
                                    )}
                                  </Button>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    PDF, DOC, DOCX, JPG, PNG up to 5MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDocumentRow}
                className="flex items-center gap-2 w-full border-dashed border-2 py-6 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Add New Document</span>
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-2">
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === "create"
                    ? "Creating..."
                    : "Updating..."
                  : mode === "create"
                    ? "Create Student"
                    : "Update Student"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
