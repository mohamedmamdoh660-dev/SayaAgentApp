"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { ZohoApplication } from "@/types/types";
import {
  Calendar,
  Building2,
  GraduationCap,
  Globe,
  User,
  Boxes,
  Loader2,
  Download as DownloadIcon,
  FileText,
} from "lucide-react";
import {
  conditionalButtonDisabled,
  finalAcceptanceButtonDisabled,
} from "@/components/(main)/zoho-applications/component/stages-conditions";
import { downloadAttachment } from "@/utils/download-attachment";

export function ZohoApplicationsCards({
  applications,
  router,
  applicationDownloading,
  setApplicationDownloading,
}: {
  applications: ZohoApplication[];
  router: any;
  applicationDownloading: { id: string; name: string };
  setApplicationDownloading: (v: { id: string; name: string }) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(applications || []).map((app) => (
        <Card key={app.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="border-foreground/10 border-[1px]">
                <AvatarImage
                  src={
                    app.zoho_students?.photo_url ||
                    generateNameAvatar(
                      `${app.zoho_students?.first_name || ""} ${app.zoho_students?.last_name || ""}`
                    )
                  }
                />
              </Avatar>
              <div className="min-w-0">
                <CardTitle
                  className="text-base font-semibold truncate cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/applications/${app.id}`)}
                >
                  {app.application_name ||
                    app.zoho_programs?.name ||
                    "Application"}
                </CardTitle>
                <div className="text-xs text-muted-foreground truncate">
                  {(app.zoho_students?.first_name || "") +
                    " " +
                    (app.zoho_students?.last_name || "")}
                </div>
              </div>
            </div>
            {app.stage ? (
              <div className="text-[12px]">
                <StatusBadge status={app.stage || ""} />
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <User className="h-4 w-4" /> Student
              </span>
              <span
                className="font-medium truncate cursor-pointer hover:text-primary"
                onClick={() =>
                  router.push(`/students/${app.zoho_students?.id}`)
                }
              >
                {`${app.zoho_students?.first_name || ""} ${app.zoho_students?.last_name || ""}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" /> University
              </span>
              <span className="font-medium truncate">
                {app.zoho_universities?.name || app.university || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Program
              </span>
              <span className="font-medium truncate">
                {app.zoho_programs?.name || app.program || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Boxes className="h-4 w-4" /> Degree
              </span>
              <span className="font-medium truncate">
                {app.zoho_degrees?.name || app.degree || "-"}
              </span>
            </div>
            {app.agent ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground inline-flex items-center gap-2">
                  <User className="h-4 w-4" /> Agent
                </span>
                <span className="font-medium truncate">
                  {`${app.agent?.first_name || ""} ${app.agent?.last_name || ""}`.trim() ||
                    "-"}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Academic/Semester
              </span>
              <span className="font-medium truncate">
                {app.zoho_academic_years?.name || "-"} /{" "}
                {app.zoho_semesters?.name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Globe className="h-4 w-4" /> Country
              </span>
              <span className="font-medium truncate">
                {app.zoho_countries?.name || app.country || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Created
              </span>
              <span className="font-medium">
                {app.created_at ? currentTimezone(app.created_at) : "-"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <FileText className="h-4 w-4" /> Conditional Letter
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  conditionalButtonDisabled(app?.stage?.toLowerCase() || "") ||
                  (applicationDownloading.id === app.id &&
                    applicationDownloading.name === "conditional")
                }
                onClick={async () => {
                  setApplicationDownloading({
                    id: app.id,
                    name: "conditional",
                  });
                  await downloadAttachment(app.id, "conditional");
                  setApplicationDownloading({ id: "", name: "" });
                }}
              >
                {applicationDownloading.id === app.id &&
                applicationDownloading.name === "conditional" ? (
                  <Loader2 className=" h-3 w-3 animate-spin" />
                ) : (
                  <DownloadIcon className=" h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <FileText className="h-4 w-4" /> Final Acceptance
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  finalAcceptanceButtonDisabled(
                    app?.stage?.toLowerCase() || ""
                  ) ||
                  (applicationDownloading.id === app.id &&
                    applicationDownloading.name === "final")
                }
                onClick={async () => {
                  setApplicationDownloading({ id: app.id, name: "final" });
                  await downloadAttachment(app.id, "final");
                  setApplicationDownloading({ id: "", name: "" });
                }}
              >
                {applicationDownloading.id === app.id &&
                applicationDownloading.name === "final" ? (
                  <Loader2 className=" h-3 w-3 animate-spin" />
                ) : (
                  <DownloadIcon className=" h-3 w-3" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
