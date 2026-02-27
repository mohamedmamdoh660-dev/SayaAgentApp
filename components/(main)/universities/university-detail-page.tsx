"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, GraduationCap } from "lucide-react";
import Loader from "@/components/loader";
import InfoGraphic from "@/components/ui/info-graphic";
import { ZohoProgram, ZohoUniversity } from "@/types/types";
import { universitiesService } from "@/modules/universities/services/universities-service";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import UniversityDetails from "@/components/(main)/universities/component/university-details";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProgramsPagination } from "@/supabase/actions/db-actions";
import { formatNumber } from "@/utils/format-number";

export default function UniversityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const universityId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [university, setUniversity] = useState<ZohoUniversity | null>(null);
  const [programs, setPrograms] = useState<ZohoProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Initialize tab from querystring (?tab=...)
  useEffect(() => {
    const tabParam = (searchParams?.get("tab") || "").toLowerCase();
    if (!tabParam) return;
    if (["details", "programs"].includes(tabParam)) {
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

  const getUniversity = useCallback(async () => {
    try {
      setIsLoading(true);
      const universityData =
        await universitiesService.getUniversityById(universityId);
      setUniversity(universityData);
    } catch (error) {
      console.error("Error fetching university:", error);
    } finally {
      setIsLoading(false);
    }
  }, [universityId]);

  const getPrograms = useCallback(async () => {
    try {
      if (!universityId) return;
      setIsLoadingPrograms(true);
      const programsData: any = await getProgramsPagination(
        "",
        1000,
        0,

        { university: universityId },

        { sortBy: "created_at", sortOrder: "desc" }
      );
      setPrograms(programsData.programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setIsLoadingPrograms(false);
    }
  }, [universityId]);

  useEffect(() => {
    if (universityId) {
      getUniversity();
      getPrograms();
    }
  }, [universityId, getUniversity, getPrograms]);

  const getInitials = (name?: string) => {
    if (!name) return "UN";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return `${parts[0][0] || "U"}${parts[1][0] || "N"}`.toUpperCase();
  };

  let toastId: any = null;

  if (isLoading) return <Loader />;

  if (!university) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <InfoGraphic
          title="University Not Found"
          description="The university you are looking for does not exist."
          icon={<Building2 className="!w-16 !h-16 text-primary" />}
          isLeftArrow={false}
          gradient={false}
        />
      </div>
    );
  }

  const universityName = university?.name || "";
  const countryName = university?.zoho_countries?.name || "N/A";
  const cityName = university?.zoho_cities?.name || "N/A";

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card">
          <div className="p-8 pb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-accent/20">
                <AvatarImage
                  src={university?.logo || generateNameAvatar(universityName)}
                  alt={universityName || "University"}
                />
                <AvatarFallback className="text-xl font-bold bg-accent/10 text-primary">
                  {getInitials(universityName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <Tooltip>
                    <TooltipTrigger>
                      <h1
                        className="text-3xl font-bold text-foreground"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textAlign: "left",
                        }}
                      >
                        {universityName}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent>{universityName}</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {university?.sector ? (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-[13px]"
                    >
                      <Building2 className="!w-4 !h-4 mr-1" />
                      {university.sector}
                    </Badge>
                  ) : null}
                  {countryName !== "N/A" && cityName !== "N/A" ? (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-[13px]"
                    >
                      <MapPin className="!w-4 !h-4 mr-1" />
                      {countryName}, {cityName}
                    </Badge>
                  ) : null}
                </div>
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
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                University Details
              </TabsTrigger>
              <TabsTrigger
                value="programs"
                className="data-[state=active]:bg-accent dark:data-[state=active]:text-primary-foreground"
              >
                Programs ({programs.length})
              </TabsTrigger>
            </TabsList>

            {/* University Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <UniversityDetails university={university} />
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6">
              <Card className="shadow-sm gap-2">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                    University Programs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> */}
                  {isLoadingPrograms ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <Loader />
                    </div>
                  ) : programs.length === 0 ? (
                    <InfoGraphic
                      icon={
                        <GraduationCap className="!w-16 !h-16 text-primary" />
                      }
                      title="No programs found"
                      description="There are no programs found for this university."
                      isLeftArrow={false}
                      gradient={false}
                    />
                  ) : (
                    <Table>
                      <TableHeader className="rounded-[20px]">
                        <TableRow>
                          <TableHead className="text-muted-foreground">
                            Program Name
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Degree
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Faculty
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Language
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Speciality
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Tuition
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programs.map((program) => (
                          <TableRow key={program.id}>
                            <TableCell
                              className="font-medium"
                              onClick={() =>
                                router.push(`/programs/${program.id}`)
                              }
                            >
                              <span
                                className=" cursor-pointer hover:underline hover:text-primary leading-tight line-clamp-2 text-wrap"
                                title={program.name || "N/A"}
                              >
                                {program.name || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {program.zoho_degrees?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <span
                                className="  leading-tight line-clamp-2 text-wrap"
                                title={program.name || "N/A"}
                              >
                                {program.zoho_faculty?.name || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {program.zoho_languages?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <span
                                className="  leading-tight line-clamp-2 text-wrap"
                                title={program.name || "N/A"}
                              >
                                {program.zoho_speciality?.name || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-left">
                                <div>{`${formatNumber(Number(program.official_tuition))} ${program.tuition_currency || ""}`}</div>
                                {program.discounted_tuition && (
                                  <div className="text-xs text-green-600">{`Discounted: ${formatNumber(Number(program.discounted_tuition))} ${program.tuition_currency || ""}`}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-[12px]">
                                {program.active ? (
                                  <StatusBadge status="active" />
                                ) : (
                                  <StatusBadge status="inactive" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {/* </div> */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
