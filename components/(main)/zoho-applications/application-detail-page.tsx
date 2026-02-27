"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  MapPin,
  FileText,
  User,
  Building2,
  ChevronDown,
  Printer,
  Upload,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react";
import Loader from "@/components/loader";
import InfoGraphic from "@/components/ui/info-graphic";
import { ZohoApplication } from "@/types/types";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { getApplicationById } from "@/supabase/actions/db-actions";
import { saveFile } from "@/supabase/actions/save-file";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuContent } from "@/components/dropdown-menu";

import { DocumentAttachmentDialog } from "@/components/ui/document-attachment-dialog";
import { zohoAttachmentsService } from "@/modules/zoho-attachments/services/zoho-attachments-service";
import { downloadAttachment } from "@/utils/download-attachment";
import { supabaseClient } from "@/lib/supabase-auth-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { generateApplicationPDF } from "@/utils/generate-application-pdf";
import {
  canUploadCard,
  canUploadPayment,
  conditionalButtonDisabled,
  finalAcceptanceButtonDisabled,
} from "./component/stages-conditions";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { uploadApplicationAttachment } from "@/lib/actions/zoho-applications-actions";
import ApplicationNotes from "./component/application-notes";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState<ZohoApplication | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMissingOpen, setIsMissingOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [letterDownloadingId, setLetterDownloadingId] = useState<string | null>(
    null
  );
  const [letters, setLetters] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("application");
  const [notesCount, setNotesCount] = useState<number>(0);

  // Initialize tab from querystring (?tab=...)
  useEffect(() => {
    const tabParam = (searchParams?.get("tab") || "").toLowerCase();
    if (!tabParam) return;
    if (
      ["application", "student", "university", "letters", "notes"].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const updateQueryForTab = useCallback(
    (tab: string) => {
      const query = `?tab=${tab}`;
      router.replace(`${window.location.pathname}${query}`);
    },
    [router]
  );

  const getApplication = useCallback(async () => {
    try {
      setIsLoading(true);
      const app = await getApplicationById(applicationId);
      setApplication(app);
    } catch (error) {
      console.error("Error fetching application:", error);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) {
      getApplication();
    }
  }, [applicationId, getApplication]);

  // Realtime updates for this application id
  useEffect(() => {
    if (!applicationId) return;
    const channel = supabaseClient
      .channel(`rt-app-${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "zoho_applications",
          filter: `id=eq.${applicationId}`,
        },
        () => getApplication()
      )
      .subscribe();
    return () => {
      try {
        supabaseClient.removeChannel(channel);
      } catch {}
    };
  }, [applicationId, getApplication]);

  useEffect(() => {
    const loadLetters = async () => {
      try {
        const rows = await zohoAttachmentsService.getByModuleId(applicationId);
        setLetters(rows.map((r) => ({ id: r.id, name: r.name || "Letter" })));
      } catch {}
    };
    if (applicationId) loadLetters();
  }, [applicationId]);

  // No separate student fetch; use student data included in the application record

  const getInitials = (name?: string) => {
    if (!name) return "AP";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "A";
    return `${parts[0][0] || "A"}${parts[1][0] || "P"}`.toUpperCase();
  };

  const safe = (v?: any) => (v === undefined || v === null ? "N/A" : String(v));

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) return <Loader />;

  if (!application) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <InfoGraphic
          title="Application Not Found"
          description="The application you are looking for does not exist."
          icon={<FileText className="!w-16 !h-16 text-primary" />}
          isLeftArrow={false}
          gradient={false}
        />
      </div>
    );
  }

  const studentFullName =
    `${application?.zoho_students?.first_name || ""} ${application?.zoho_students?.last_name || ""}`.trim();
  const universityName = application?.zoho_universities?.name || "";
  const programName = application?.zoho_programs?.name || "";

  const stage = (application?.stage || "").toLowerCase();

  let toastId: any = null;

  const handleGeneratePDF = async () => {
    if (!application) return;

    try {
      toastId = toast.loading("Generating PDF...");
      setIsGeneratingPDF(true);
      await generateApplicationPDF(application, {
        filename: `application-${application.id}.pdf`,
        quality: 0.98,
        scale: 2,
      });
      toast.success("PDF generated successfully", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleUpload = async (type: "card" | "payment") => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
          if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            setIsUploading(false);
            return;
          }
          if (!allowedTypes.includes(file.type)) {
            toast.error(
              "Please select a valid document file (PDF, DOC, DOCX, JPG, PNG)"
            );
            return;
          }
          const fileUrl = await saveFile(file);
          if (!fileUrl) {
            toast.error("Failed to upload file");
            setIsUploading(false);
            return;
          }
          await uploadApplicationAttachment(
            application?.id || "",
            type,
            fileUrl
          );

          toast.success(
            type === "card"
              ? "Student card uploaded"
              : "Payment receipt uploaded"
          );
        } catch (err) {
          console.error(err);
          toast.error("Upload failed");
        } finally {
          setIsUploading(false);
        }
      };
      input.click();
    } catch (e) {
      console.error(e);
      toast.error("Could not open file picker");
    }
  };

  return (
    <div className=" bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card ">
          <div className="p-8 pb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <Avatar className="h-24 w-24 ring-4 ring-accent/20">
                <AvatarImage
                  src={
                    application?.zoho_students?.photo_url ||
                    generateNameAvatar(studentFullName)
                  }
                  alt={studentFullName || "Student"}
                />
                <AvatarFallback className="text-xl font-bold bg-accent/10 text-primary">
                  {getInitials(studentFullName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <Tooltip>
                    <TooltipTrigger>
                      <h1
                        className={`text-3xl font-bold text-foreground ${studentFullName && !application?.application_name ? "hover:cursor-pointer hover:text-primary !flex flex-row items-center" : ""}`}
                        onClick={() =>
                          studentFullName &&
                          !application?.application_name &&
                          router.push(
                            `/students/${application?.zoho_students?.id}`
                          )
                        }
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textAlign: "left",
                        }}
                      >
                        {application?.application_name || studentFullName}
                        {!application?.application_name && (
                          <ExternalLink className="!w-5 !h-5 ml-1" />
                        )}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent>
                      {application?.application_name || studentFullName}
                    </TooltipContent>
                  </Tooltip>
                  {application?.application_name && (
                    <p
                      className="text-lg text-muted-foreground  hover:cursor-pointer hover:text-primary flex flex-row items-center"
                      onClick={() =>
                        router.push(
                          `/students/${application?.zoho_students?.id}`
                        )
                      }
                    >
                      {studentFullName}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {application?.stage ? (
                    <div className="text-[12px]">
                      <StatusBadge status={application.stage} />
                    </div>
                  ) : null}
                  {/* {application?.zoho_degrees?.name ? (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-[13px]"
                    >
                      <GraduationCap className="!w-4 !h-4 mr-1" />
                      {application.zoho_degrees.name}
                    </Badge>
                  ) : null}
                  {application?.zoho_countries?.name ? (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-[13px]"
                    >
                      <MapPin className="!w-4 !h-4 mr-1" />
                      {application.zoho_countries.name}
                    </Badge>
                  ) : null} */}
                </div>
              </div>

              <div className="flex gap-3">
                {application?.stage?.toLowerCase() === "missing" && (
                  <>
                    <Button
                      variant="outline"
                      disabled={true}
                      onClick={() => setIsMissingOpen(true)}
                    >
                      <Upload className="w-4 h-4 mr-1" /> Upload Missing
                    </Button>
                    <DocumentAttachmentDialog
                      open={isMissingOpen}
                      onOpenChange={setIsMissingOpen}
                      onUploaded={() => setIsMissingOpen(false)}
                    />
                  </>
                )}
                {!conditionalButtonDisabled(stage) && (
                  <Button
                    variant="outline"
                    disabled={downloading}
                    onClick={() =>
                      downloadAttachment(application?.id || "", "conditional")
                    }
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    Download Conditionals
                  </Button>
                )}
                {!finalAcceptanceButtonDisabled(stage) && (
                  <Button
                    variant="outline"
                    disabled={downloading}
                    onClick={() =>
                      downloadAttachment(application?.id || "", "final")
                    }
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    Download Final Acceptance
                  </Button>
                )}
                {canUploadPayment(stage) && (
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => handleUpload("payment")}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    {isUploading ? "Uploading…" : "Upload Payment Receipt"}
                  </Button>
                )}
                {canUploadCard(stage) && (
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => handleUpload("card")}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}

                    {isUploading ? "Uploading…" : "Upload Student Card"}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      <span>{isGeneratingPDF ? "Generating..." : "Print"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              updateQueryForTab(v);
            }}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-5 bg-muted/50 ">
              <TabsTrigger
                value="application"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Application Details
              </TabsTrigger>
              <TabsTrigger
                value="student"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Student Information
              </TabsTrigger>
              <TabsTrigger
                value="university"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                University Information
              </TabsTrigger>
              <TabsTrigger
                value="letters"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                University Letters
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Notes {`(${notesCount})`}
              </TabsTrigger>
            </TabsList>

            {/* Application Details Tab */}
            <TabsContent value="application" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Online Application ID
                      </p>
                      <p className="font-medium">
                        {application?.online_application_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Program
                      </p>
                      <p className="font-medium">{programName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        University
                      </p>
                      <p className="font-medium">{universityName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Country
                      </p>
                      <p className="font-medium">
                        {application?.zoho_countries?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Academic Year
                      </p>
                      <p className="font-medium">
                        {application?.zoho_academic_years?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Semester
                      </p>
                      <p className="font-medium">
                        {application?.zoho_semesters?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Degree
                      </p>
                      <p className="font-medium">
                        {application?.zoho_degrees?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Stage
                      </p>
                      <StatusBadge status={application?.stage || ""} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Created At
                      </p>
                      <p className="font-medium">
                        {formatDate(application?.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Updated At
                      </p>
                      <p className="font-medium">
                        {formatDate(application?.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Student Information Tab */}
            <TabsContent value="student" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        First Name
                      </p>
                      <p className="font-medium">
                        {application?.zoho_students?.first_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Last Name
                      </p>
                      <p className="font-medium">
                        {application?.zoho_students?.last_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Passport No
                      </p>
                      <p className="font-mono font-medium">
                        {application?.zoho_students?.passport_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Issue Date
                      </p>
                      <p className="font-medium">
                        {formatDate(
                          application?.zoho_students?.passport_issue_date || ""
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Expiry Date
                      </p>
                      <p className="font-medium">
                        {formatDate(
                          application?.zoho_students?.passport_expiry_date || ""
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Gender
                      </p>
                      <p className="font-medium">
                        {application?.zoho_students?.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Nationality
                      </p>
                      <p className="font-medium">
                        {application?.zoho_students?.nationality_record?.name ||
                          application?.zoho_students?.nationality ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        City of Residence
                      </p>
                      <p className="font-medium">
                        {application?.zoho_students?.address_country_record
                          ?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Mobile
                      </p>
                      <p className="font-medium">
                        {application?.zoho_students?.mobile || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Email
                      </p>
                      <p className="font-medium break-all">
                        {application?.zoho_students?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* University Information Tab */}
            <TabsContent value="university" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                    University Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Name
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Sector
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.sector || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Country
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.zoho_countries?.name ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        City
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.zoho_cities?.name ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Year Founded
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.year_founded || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        QS Rank
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.qs_rank || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Times Higher Education Rank
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities
                          ?.times_higher_education_rank || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Shanghai Ranking
                      </p>
                      <p className="font-medium">
                        {application?.zoho_universities?.shanghai_ranking ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* University Letters Tab */}
            <TabsContent value="letters" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    University Letters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {letters.length === 0 ? (
                    <InfoGraphic
                      icon={<FileText className="!w-16 !h-16 text-primary" />}
                      title="No letters found"
                      description="There are no letters found for this application."
                      isLeftArrow={false}
                      gradient={false}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {letters.map((l) => (
                        <Card
                          key={l.id}
                          className="group border hover:border-primary/30 transition-colors"
                        >
                          <CardContent className="px-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {l.name || "Letter"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Attachment ID: {l.id}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={letterDownloadingId === l.id}
                              onClick={async () => {
                                try {
                                  setLetterDownloadingId(l.id);
                                  await downloadAttachment(
                                    applicationId,
                                    l.name.toLowerCase().includes("conditional")
                                      ? "çonditional"
                                      : l.name
                                            .toLowerCase()
                                            .includes("final acceptance")
                                        ? "final"
                                        : l.name
                                  );
                                } catch {
                                } finally {
                                  setLetterDownloadingId(null);
                                }
                              }}
                            >
                              {letterDownloadingId === l.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* University Letters Tab */}
            <TabsContent value="notes" className="space-y-6">
              <ApplicationNotes
                applicationId={applicationId}
                onCountChange={setNotesCount}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
