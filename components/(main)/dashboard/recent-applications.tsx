"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getRecentApplications } from "@/modules/dashboard/services/dashboard-service";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RecentApplications() {
  const [isReloading, setIsReloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const router = useRouter();
  const { userProfile } = useAuth();

  const fetchApplications = async (
    userId: string | undefined,
    agencyId: string | undefined,
    role: string | undefined
  ) => {
    try {
      setLoading(true);
      const data = await getRecentApplications(10, userId, agencyId, role);
      setApplications(data);
    } catch (error) {
      console.error("Error fetching recent applications:", error);
      toast.error("Failed to load recent applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(
      userProfile?.id,
      userProfile?.agency_id,
      userProfile?.roles?.name
    );
  }, []);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await fetchApplications(
        userProfile?.id,
        userProfile?.agency_id,
        userProfile?.roles?.name
      );
    } catch (error) {
      console.error("Error reloading applications:", error);
      toast.error("Failed to reload applications");
    } finally {
      setIsReloading(false);
    }
  };

  const handleViewDetails = (applicationId: string) => {
    router.push(`/applications/${applicationId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  //   if (applications.length === 0) {
  //     return (
  //       <InfoGraphic
  //         icon={<InfoIcon className="h-6 w-6" />}
  //         title="No recent applications found"
  //         description="There are no recent applications available at the moment."
  //         isLeftArrow={false}
  //         gradient={false}
  //       />
  //     );
  //   }

  return (
    <Card className="gap-2 pb-0">
      <CardHeader className="pl-4">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Applications</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReload}
            disabled={loading || isReloading}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (loading || isReloading) && "animate-spin"
              )}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-4 pr-0 pb-0">
        <div className="">
          <div className="pr-4">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Academic Year/Semester</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.zoho_students ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="border-foreground/10 border-[1px]">
                              <AvatarImage
                                src={
                                  application.zoho_students.photo_url ||
                                  generateNameAvatar(
                                    application.zoho_students.first_name +
                                      " " +
                                      application.zoho_students.last_name
                                  )
                                }
                              />
                            </Avatar>
                            <div className="flex flex-col">
                              <span
                                onClick={() =>
                                  router.push(
                                    `/students/${application.zoho_students?.id}`
                                  )
                                }
                                className="hover:cursor-pointer hover:text-primary"
                              >
                                {application.zoho_students.first_name}{" "}
                                {application.zoho_students.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {application.zoho_students.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          "Unknown Student"
                        )}
                      </TableCell>
                      <TableCell
                        onClick={() =>
                          router.push(
                            `/programs/${application.zoho_programs?.id}`
                          )
                        }
                        className="hover:cursor-pointer hover:text-primary"
                      >
                        {application.zoho_programs?.name || "Unknown Program"}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-2 hover:cursor-pointer hover:text-primary"
                          onClick={() =>
                            router.push(
                              `/universities/${application.zoho_universities?.id}`
                            )
                          }
                        >
                          {application.zoho_universities?.logo && (
                            <div className="w-6 h-6 relative overflow-hidden rounded-full">
                              <Image
                                src={application.zoho_universities.logo}
                                alt={
                                  application.zoho_universities.name ||
                                  "University"
                                }
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                            </div>
                          )}
                          {application.zoho_universities?.name ||
                            "Unknown University"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.zoho_academic_years?.name || "-"} /{" "}
                        {application.zoho_semesters?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {application.created_at
                          ? format(
                              new Date(application.created_at),
                              "MMM d, yyyy"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-[12px]">
                          <StatusBadge status={application.stage || ""} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info
                                className="!h-6 !w-6 hover:cursor-pointer hover:text-primary"
                                onClick={() =>
                                  router.push(`/applications/${application.id}`)
                                }
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>
                          {/* <ZohoApplicationsTableRowActions
            row={row}
            fetchApplications={fetchApplications}
          /> */}
                        </div>{" "}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
