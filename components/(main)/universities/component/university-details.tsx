"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Building2 } from "lucide-react";
import { ZohoUniversity } from "@/types/types";
import { StatusBadge } from "@/components/ui/status-badge";

interface UniversityDetailsProps {
  university: ZohoUniversity;
}

export default function UniversityDetails({
  university,
}: UniversityDetailsProps) {
  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5 text-primary" />
          University Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Name
            </p>
            <p className="font-medium">{university?.name || "N/A"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Sector
            </p>
            <p className="font-medium">{university?.sector || "N/A"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Location
            </p>
            <p className="font-medium">
              {university?.zoho_countries?.name || "N/A"},{" "}
              {university?.zoho_cities?.name || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Year Founded
            </p>
            <p className="font-medium">{university?.year_founded || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Phone
            </p>
            <p className="font-medium">{university?.phone || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Website
            </p>
            <p className="font-medium">
              {university?.wesbite ? (
                <a
                  href={
                    university.wesbite.startsWith("http")
                      ? university.wesbite
                      : `https://${university.wesbite}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  {university.wesbite}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ) : (
                "N/A"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Address
            </p>
            <p className="font-medium">{university?.address || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              QS Rank
            </p>
            <p className="font-medium">{university?.qs_rank || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Times Higher Education Rank
            </p>
            <p className="font-medium">
              {university?.times_higher_education_rank || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Shanghai Ranking
            </p>
            <p className="font-medium">
              {university?.shanghai_ranking || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Active in Applications
            </p>
            <p className="font-medium">
              {university?.active_in_apps ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Status
            </p>
            <p className="font-medium">
              {university?.active ? (
                <StatusBadge status="active" />
              ) : (
                <StatusBadge status="inactive" />
              )}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Accommodation
            </p>
            <p className="font-medium">{university?.acomodation || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Created At
            </p>
            <p className="font-medium">{formatDate(university?.created_at)}</p>
          </div>
          {/* Updated At */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Updated At
            </p>
            <p className="font-medium">{formatDate(university?.update_at)}</p>
          </div>

          {/* Description */}
          <div className="col-span-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </p>
            <p className="font-medium">{university?.description || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
