"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  Edit,
  GraduationCap,
  Users,
  CreditCard,
  Home,
  Eye,
  Loader2,
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceType, ZohoApplication, ZohoStudent } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import InfoGraphic from "@/components/ui/info-graphic";
import { getStudentById } from "@/supabase/actions/db-actions";
import { zohoAttachmentsService } from "@/modules/zoho-attachments/services/zoho-attachments-service";
import { downloadAttachment } from "@/utils/download-attachment";

import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { zohoApplicationsService } from "@/modules/zoho-applications/services/zoho-applications-service";
import { supabaseClient } from "@/lib/supabase-auth-client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/ui/status-badge";
import AddZohoApplication from "@/components/(main)/zoho-applications/component/add-zoho-application";
import { useAuth } from "@/context/AuthContext";
import { canCreate } from "@/lib/permissions";

export function StudentDetailPage() {
  const [student, setStudent] = useState<ZohoStudent | null>(null);
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const studentId = params.id as string;
  const router = useRouter();
  const [letterDownloadingId, setLetterDownloadingId] = useState<string | null>(
    null
  );
  const [addOpen, setAddOpen] = useState(false);
  const { userProfile } = useAuth();

  const getStudent = async () => {
    try {
      setIsLoading(true);
      const student = await getStudentById(studentId);
      setIsLoading(false);
      setStudent({
        ...student,
      });
    } catch (error) {
      console.log("🚀 ~ getStudent ~ error:", error);
    }
  };

  const [attachments, setAttachments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [applications, setApplications] = useState<ZohoApplication[]>([]);
  useEffect(() => {
    const loadAttachments = async () => {
      try {
        if (!studentId) return;
        const rows = await zohoAttachmentsService.getByModuleAndId(
          "Contacts",
          studentId
        );
        setAttachments(
          rows.map((r) => ({ id: r.id, name: r.name || "Document" }))
        );
      } catch {}
    };
    loadAttachments();
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      getStudent();
    }
  }, [studentId]);

  // Realtime updates for this student id and their applications
  useEffect(() => {
    if (!studentId) return;
    const chStudent = supabaseClient
      .channel(`rt-student-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "zoho_students",
          filter: `id=eq.${studentId}`,
        },
        () => getStudent()
      )
      .subscribe();

    const chApps = supabaseClient
      .channel(`rt-student-apps-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "zoho_applications",
          filter: `student=eq.${studentId}`,
        },
        async () => {
          try {
            const apps =
              await zohoApplicationsService.getApplicationsByStudent(studentId);
            setApplications(apps || []);
          } catch {}
        }
      )
      .subscribe();

    return () => {
      try {
        supabaseClient.removeChannel(chStudent);
      } catch {}
      try {
        supabaseClient.removeChannel(chApps);
      } catch {}
    };
  }, [studentId]);

  useEffect(() => {
    const loadApps = async () => {
      try {
        const apps =
          await zohoApplicationsService.getApplicationsByStudent(studentId);
        setApplications(apps || []);
      } catch {}
    };
    if (studentId) loadApps();
  }, [studentId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <InfoGraphic
          title="Student Not Found"
          description="The student you are looking for does not exist."
          icon={<FileText className="!w-16 !h-16 text-primary" />}
          isLeftArrow={false}
          gradient={false}
        />
      </div>
    );
  }

  return (
    <div className=" bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Top Profile Section */}
        <div className="bg-card ">
          <div className="p-8 pb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <Avatar className="h-24 w-24 ring-4 ring-accent/20">
                <AvatarImage
                  src={
                    student?.photo_url ||
                    generateNameAvatar(
                      `${student?.first_name} ${student?.last_name}`
                    )
                  }
                  alt={`${student?.first_name} ${student?.last_name}`}
                />
                <AvatarFallback className="text-xl font-bold bg-accent/10 text-primary">
                  {getInitials(student?.first_name, student?.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-3xl font-bold text-foreground text-balance">
                    {student?.first_name} {student?.last_name}
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Student ID: {student?.id || "N/A"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    <User className="w-3 h-3 mr-1" />
                    {student?.gender || "N/A"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(student?.date_of_birth || "")}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {student?.nationality_record?.name ||
                      student?.nationality ||
                      "N/A"}
                  </Badge>
                  {student?.education_level_name ? (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {student.education_level_name}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {canCreate(userProfile, ResourceType.APPLICATIONS) && (
                <div className="flex gap-3">
                  <Button onClick={() => setAddOpen(true)}>
                    Add Application
                  </Button>
                  <AddZohoApplication
                    open={addOpen}
                    onOpenChange={setAddOpen}
                    onRefresh={async () => {
                      try {
                        const apps =
                          await zohoApplicationsService.getApplicationsByStudent(
                            studentId
                          );
                        setApplications(apps || []);
                      } catch {}
                    }}
                    presetStudentId={studentId}
                    presetStudentName={`${student?.first_name || ""} ${student?.last_name || ""}`}
                    lockStudent
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 pt-0">
          <Tabs defaultValue="applications" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50">
              <TabsTrigger
                value="applications"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Applications
              </TabsTrigger>
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Personal Details
              </TabsTrigger>
              <TabsTrigger
                value="education"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Education History
              </TabsTrigger>
              <TabsTrigger
                value="family"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Family Info
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="w-5 h-5 text-primary" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Email
                        </p>
                        <p className="font-medium break-all">
                          {student?.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Mobile
                        </p>
                        <p className="font-medium">
                          {student?.mobile || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Have TC
                        </p>
                        <p className="font-medium">
                          {student?.have_tc || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Transfer Student
                        </p>
                        <p className="font-medium">
                          {student?.transfer_student || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Blue Card
                        </p>
                        <p className="font-medium">
                          {student?.blue_card || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="w-5 h-5 text-primary" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Address
                      </p>
                      <p className="font-medium">
                        {student?.address_line_1 || "N/A"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          City/District
                        </p>
                        <p className="font-medium">
                          {student?.city_district || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          State/Province
                        </p>
                        <p className="font-medium">
                          {student?.state_province || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Postal Code
                        </p>
                        <p className="font-medium">
                          {student?.postal_code || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Country
                        </p>
                        <p className="font-medium">
                          {student?.address_country_record?.name ||
                            student?.address_country ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Passport Details */}
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Passport & Identity Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Passport Number
                      </p>
                      <p className="font-medium">
                        {student?.passport_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Issue Date
                      </p>
                      <p className="font-medium">
                        {formatDate(student?.passport_issue_date || "")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Expiry Date
                      </p>
                      <p className="font-medium">
                        {formatDate(student?.passport_expiry_date || "")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        TC Number
                      </p>
                      <p className="font-medium">
                        {student?.tc_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education History Tab */}
            <TabsContent value="education" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      Educational Background
                    </CardTitle>
                    {student?.academic_level_record?.name ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-[13px]"
                      >
                        {student.academic_level_record.name}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  {student?.academic_level_record?.name ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* High School */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <h4 className="font-semibold text-lg">High School</h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              School Name
                            </p>
                            <p className="font-medium">
                              {student?.high_school_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Country
                            </p>
                            <p className="font-medium">
                              {student?.high_school_country || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              GPA
                            </p>
                            <Badge variant="outline" className="">
                              {student?.high_school_gpa_percent || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Bachelor's */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <h4 className="font-semibold text-lg">
                            Bachelor's Degree
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              School Name
                            </p>
                            <p className="font-medium">
                              {student?.bachelor_school_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Country
                            </p>
                            <p className="font-medium">
                              {student?.bachelor_country || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              GPA
                            </p>
                            <Badge variant="outline" className="">
                              {student?.bachelor_gpa_percent || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Master's */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <h4 className="font-semibold text-lg">
                            Master's Degree
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              School Name
                            </p>
                            <p className="font-medium">
                              {student?.master_school_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Country
                            </p>
                            <p className="font-medium">
                              {student?.master_country || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              GPA
                            </p>
                            <Badge variant="outline" className="">
                              {student?.master_gpa_percent || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <InfoGraphic
                      icon={
                        <GraduationCap className="!w-16 !h-16 text-primary" />
                      }
                      title="No educational background found"
                      description="There is no educational background found for this student."
                      isLeftArrow={false}
                      gradient={false}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Family Information Tab */}
            <TabsContent value="family" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Father's Information */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-primary" />
                      Father's Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Name
                      </p>
                      <p className="font-medium text-lg">
                        {student?.father_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Mobile
                      </p>
                      <p className="font-medium">
                        {student?.father_mobile || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Occupation
                      </p>
                      <p className="font-medium">
                        {student?.father_job || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Mother's Information */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-primary" />
                      Mother's Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Name
                      </p>
                      <p className="font-medium text-lg">
                        {student?.mother_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Mobile
                      </p>
                      <p className="font-medium">
                        {student?.mother_mobile || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Occupation
                      </p>
                      <p className="font-medium">
                        {student?.mother_job || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    Student Documents ({attachments.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {attachments.map((doc) => (
                        <Card
                          key={doc.id}
                          className="group border hover:border-primary/30 transition-colors"
                        >
                          <CardContent className="px-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {doc.name || "Letter"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Attachment ID: {doc.id}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={letterDownloadingId === doc.id}
                              onClick={async () => {
                                try {
                                  setLetterDownloadingId(doc.id);
                                  await downloadAttachment(
                                    studentId,
                                    doc.name || "Letter.pdf"
                                  );
                                } catch {
                                } finally {
                                  setLetterDownloadingId(null);
                                }
                              }}
                            >
                              {letterDownloadingId === doc.id ? (
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
                  ) : (
                    <InfoGraphic
                      icon={<FileText className="!w-16 !h-16 text-primary" />}
                      title="No documents found"
                      description="THere are no documents found for this student."
                      isLeftArrow={false}
                      gradient={false}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              {/* Applications overview */}
              <div className="">
                <Card className="shadow-sm gap-2">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-primary" /> Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <InfoGraphic
                          icon={
                            <FileText className="!w-16 !h-16 text-primary" />
                          }
                          title="No applications found"
                          description="There are no applications found for this student."
                          isLeftArrow={false}
                          gradient={false}
                        />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className=" rounded-[20px]">
                          <TableRow>
                            <TableHead className="text-muted-foreground">
                              App-id
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              University
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Program
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Academic Year/Semester
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Stage
                            </TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {applications.map((a: any) => (
                            <TableRow
                              key={a.app_id}
                              // className="cursor-pointer"
                              // onClick={() =>
                              //   router.push(`/applications/${a.id}`)
                              // }
                            >
                              <TableCell className="font-medium">
                                {a.app_id || "-"}
                              </TableCell>
                              <TableCell>
                                {a.zoho_universities?.name ||
                                  a.university ||
                                  "-"}
                              </TableCell>
                              <TableCell
                                onClick={() =>
                                  router.push(
                                    `/programs/${a.zoho_programs?.id}`
                                  )
                                }
                                className="hover:cursor-pointer hover:text-primary"
                              >
                                {a.zoho_programs?.name || a.program || "-"}
                              </TableCell>

                              <TableCell>
                                {a.zoho_academic_years?.name ||
                                  a.acdamic_year ||
                                  "-"}{" "}
                                / {a.zoho_semesters?.name || a.semester || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="text-[12px]">
                                  <StatusBadge status={a.stage || ""} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info
                                        className="!h-5 !w-5 hover:cursor-pointer hover:text-primary"
                                        onClick={() =>
                                          router.push(`/applications/${a?.id}`)
                                        }
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
