"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ZohoProgram } from "@/types/types";
import { currentTimezone } from "@/lib/helper/current-timezone";
import educationalProgramsImage from "@/public/images/educational-programs.png";
import {
  Building2,
  Calendar,
  Globe,
  GraduationCap,
  MapPin,
  Info,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatNumber } from "@/utils/format-number";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ZohoProgramsCards({
  programs,
  router,
}: {
  programs: ZohoProgram[];
  router: any;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      {(programs || []).map((program) => (
        <Card
          key={program.id}
          className="hover:shadow-md transition-all duration-500 ease-in-out overflow-hidden pt-0 gap-4 relative hover:scale-102 will-change-transform"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-1 rounded hover:bg-muted absolute top-2 right-2 z-10 cursor-pointer hover:text-primary"
                onClick={() => router.push(`/programs/${program.id}`)}
                aria-label="View details"
              >
                <Info className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View details</p>
            </TooltipContent>
          </Tooltip>

          {/* Cover image */}
          <div className="relative h-28 w-full bg-muted flex items-center justify-center">
            {program.zoho_universities?.profile_image ? (
              <Image
                src={program.zoho_universities?.profile_image}
                alt={program.zoho_universities?.name || "Educational Programs"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <Image
                src={educationalProgramsImage}
                alt="Educational Programs"
                unoptimized
                width={90}
                height={90}
                className="object-cover opacity-50"
              />
            )}
          </div>
          <CardHeader className="flex-row items-center justify-between gap-1">
            <div className="flex items-start gap-3 min-w-0 w-full">
              {/* University logo */}
              <div className="rounded-full h-10 w-10 flex-shrink-0">
                <Avatar className="h-full w-full object-cover">
                  <AvatarImage
                    src={
                      program?.zoho_universities?.logo ||
                      generateNameAvatar(program.zoho_universities?.name || "")
                    }
                  />
                </Avatar>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <CardTitle
                  className="text-base font-semibold truncate cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/programs/${program.id}`)}
                >
                  {program.name || "Program"}
                </CardTitle>
                <div className="text-xs text-muted-foreground truncate">
                  {program.zoho_universities?.name || "-"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Degree
              </span>
              <span className="font-medium truncate">
                {program.zoho_degrees?.name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location
              </span>
              <span className="font-medium truncate">
                {program.zoho_cities?.name && program.zoho_countries?.name
                  ? `${program.zoho_cities?.name}, ${program.zoho_countries?.name}`
                  : program.zoho_cities?.name ||
                    program.zoho_countries?.name ||
                    "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Faculty
              </span>
              <span className="font-medium truncate">
                {program.zoho_faculty?.name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Globe className="h-4 w-4" /> Language
              </span>
              <span className="font-medium truncate">
                {program.zoho_languages?.name || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Tuition
              </span>
              <div className="text-right">
                <div className="font-medium truncate">
                  {program.official_tuition
                    ? `${formatNumber(Number(program.official_tuition))} ${program.tuition_currency || ""}`
                    : "-"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Discounted Tuition
              </span>
              <div className="text-right">
                <div className="font-medium truncate">
                  {program.discounted_tuition
                    ? `${formatNumber(Number(program.discounted_tuition))} ${program.tuition_currency || ""}`
                    : "-"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Status
              </span>
              <StatusBadge
                status={program.active ? "active" : "inactive"}
              />{" "}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Created
              </span>
              <span className="font-medium">
                {program.created_at ? currentTimezone(program.created_at) : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
