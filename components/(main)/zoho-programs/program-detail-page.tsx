"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import InfoGraphic from "@/components/ui/info-graphic";
import Loader from "@/components/loader";
import {
  Building2,
  GraduationCap,
  Globe,
  MapPin,
  Users,
  Languages,
  FileText,
} from "lucide-react";
import { zohoProgramsService } from "@/modules/zoho-programs/services/zoho-programs-service";
import { supabaseClient } from "@/lib/supabase-auth-client";
import { ResourceType, ZohoProgram } from "@/types/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { formatNumber } from "@/utils/format-number";
import { getApplicationsByProgramId } from "@/supabase/actions/db-actions";
import { useAuth } from "@/context/AuthContext";
import { canViewAll } from "@/lib/permissions";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const [program, setProgram] = useState<ZohoProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const { userProfile } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const p = await zohoProgramsService.getProgramById(programId);
        setProgram(p);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    if (programId) load();
  }, [programId]);

  useEffect(() => {
    const loadApps = async () => {
      try {
        const data: any = await getApplicationsByProgramId(
          programId,
          userProfile?.roles?.name || "",
          userProfile?.id || ""
        );
        setApplications(data || []);
      } catch (e) {
        console.error("Error loading applications:", e);
        setApplications([]);
      }
    };
    if (programId) loadApps();
  }, [programId]);

  if (loading) return <Loader />;
  if (!program) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <InfoGraphic
          title="Program Not Found"
          description="The program you are looking for does not exist."
          icon={<GraduationCap className="!w-16 !h-16 text-primary" />}
          isLeftArrow={false}
          gradient={false}
        />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card ">
          <div className="p-8 pb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <Avatar className="h-24 w-24 ring-4 ring-accent/20">
                <AvatarImage
                  src={
                    program.zoho_universities?.logo ||
                    generateNameAvatar(program.zoho_universities?.name || "")
                  }
                />
                <AvatarFallback className="text-xl font-bold bg-accent/10 text-primary">
                  {program?.name?.slice(0, 2)?.toUpperCase() || "PG"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <h1
                  className="text-3xl font-bold text-foreground"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {program.name}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {program.zoho_universities?.name && (
                    <Badge
                      variant="secondary"
                      className="text-[13px] bg-primary/10 text-primary border-primary/20"
                    >
                      <Building2 className="w-4 h-4 mr-1" />
                      {program.zoho_universities.name}
                    </Badge>
                  )}
                  {program.zoho_degrees?.name && (
                    <Badge
                      variant="secondary"
                      className="text-[13px] bg-primary/10 text-primary border-primary/20"
                    >
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {program.zoho_degrees.name}
                    </Badge>
                  )}
                  {program.zoho_countries?.name && (
                    <Badge
                      variant="secondary"
                      className="text-[13px] bg-primary/10 text-primary border-primary/20"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {program.zoho_countries.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Program Details
              </TabsTrigger>
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Students
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" /> Program
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        University
                      </p>
                      <p className="font-medium">
                        {program.zoho_universities?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Faculty
                      </p>
                      <p className="font-medium">
                        {program.zoho_faculty?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Speciality
                      </p>
                      <p className="font-medium">
                        {program.zoho_speciality?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Degree
                      </p>
                      <p className="font-medium">
                        {program.zoho_degrees?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Language
                      </p>
                      <p className="font-medium">
                        {program.zoho_languages?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Location
                      </p>
                      <p className="font-medium">
                        {program.zoho_cities?.name || ""}
                        {program.zoho_cities?.name &&
                        program.zoho_countries?.name
                          ? ", "
                          : ""}
                        {program.zoho_countries?.name || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Tuition
                      </p>
                      <p className="font-medium">
                        {formatNumber(Number(program?.official_tuition || 0))}{" "}
                        {program.tuition_currency || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Discounted Tuition
                      </p>
                      <p className="font-medium">
                        {formatNumber(Number(program?.discounted_tuition || 0))}{" "}
                        {program.tuition_currency || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Status
                      </p>
                      {program.active_applications ? (
                        <StatusBadge status="active" />
                      ) : (
                        <StatusBadge status="inactive" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card className="shadow-sm gap-2">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-primary" /> Students Applied
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <InfoGraphic
                      icon={<Users className="!w-16 !h-16 text-primary" />}
                      title="No applications"
                      description="No students have applied to this program yet."
                      isLeftArrow={false}
                      gradient={false}
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Academic/Semester</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell
                              onClick={() =>
                                router.push(`/applications/${a.id}`)
                              }
                            >
                              <div
                                className="max-w-[300px] cursor-pointer hover:underline hover:text-primary leading-tight line-clamp-2 text-wrap"
                                title={a.application_name || a.id}
                              >
                                {a.application_name || a.id}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className="flex items-center gap-2 cursor-pointer hover:text-primary"
                                onClick={() =>
                                  router.push(
                                    `/students/${a?.zoho_students?.id}`
                                  )
                                }
                              >
                                <Avatar className="">
                                  <AvatarImage
                                    src={
                                      a.zoho_students?.photo_url ||
                                      generateNameAvatar(
                                        `${a.zoho_students?.first_name || ""} ${a.zoho_students?.last_name || ""}`
                                      )
                                    }
                                  />
                                  <AvatarFallback>
                                    {(
                                      a.zoho_students?.first_name?.[0] || ""
                                    ).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium truncate ">
                                    {(a.zoho_students?.first_name || "") +
                                      " " +
                                      (a.zoho_students?.last_name || "")}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                    {a.zoho_students?.email || "-"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(a.zoho_academic_years?.name || "-") +
                                " / " +
                                (a.zoho_semesters?.name || "-")}
                            </TableCell>
                            <TableCell>
                              <div className="text-[12px]">
                                <StatusBadge status={a.stage || ""} />
                              </div>
                            </TableCell>
                            <TableCell>
                              {a.created_at
                                ? new Date(a.created_at).toLocaleDateString()
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
