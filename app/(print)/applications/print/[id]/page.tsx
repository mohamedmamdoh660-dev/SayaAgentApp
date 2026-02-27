"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getApplicationById } from "@/supabase/actions/db-actions";
import { ZohoApplication } from "@/types/types";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import Loader from "@/components/loader";
import InfoGraphic from "@/components/ui/info-graphic";
import { FileText } from "lucide-react";

export default function PrintApplicationPage() {
  const params = useParams();
  const id = params.id as string;
  const [application, setApplication] = useState<ZohoApplication | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const app = await getApplicationById(id);
      setApplication(app);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (application) {
      setTimeout(() => window.print(), 200);
    }
  }, [application]);

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex h-screen justify-center items-center">
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

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const studentFullName =
    `${application.zoho_students?.first_name || ""} ${application.zoho_students?.last_name || ""}`.trim();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <img
          src={
            application.zoho_students?.photo_url ||
            generateNameAvatar(studentFullName)
          }
          alt={studentFullName || "Student"}
          className="w-20 h-20 rounded-md object-cover border"
        />
        <div>
          <h1 className="text-2xl font-bold">Application #{application.id}</h1>
          <p className="text-sm text-muted-foreground">
            Printed on {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Application Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Program</div>
            <div className="font-medium">
              {application.zoho_programs?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">University</div>
            <div className="font-medium">
              {application.zoho_universities?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Country</div>
            <div className="font-medium">
              {application.zoho_countries?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Academic Year</div>
            <div className="font-medium">
              {application.zoho_academic_years?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Semester</div>
            <div className="font-medium">
              {application.zoho_semesters?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Degree</div>
            <div className="font-medium">
              {application.zoho_degrees?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Stage</div>
            <div className="font-medium">{application.stage || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created At</div>
            <div className="font-medium">
              {formatDate(application.created_at)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Updated At</div>
            <div className="font-medium">
              {formatDate(application.updated_at)}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">First Name</div>
            <div className="font-medium">
              {application.zoho_students?.first_name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Last Name</div>
            <div className="font-medium">
              {application.zoho_students?.last_name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Gender</div>
            <div className="font-medium">
              {application.zoho_students?.gender || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Passport No</div>
            <div className="font-medium">
              {application.zoho_students?.passport_number || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Issue Date</div>
            <div className="font-medium">
              {formatDate(application.zoho_students?.passport_issue_date || "")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Expiry Date</div>
            <div className="font-medium">
              {formatDate(
                application.zoho_students?.passport_expiry_date || ""
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nationality</div>
            <div className="font-medium">
              {application.zoho_students?.nationality_record?.name ||
                application.zoho_students?.nationality ||
                "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              City of Residence
            </div>
            <div className="font-medium">
              {application.zoho_students?.city_district || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Mobile</div>
            <div className="font-medium">
              {application.zoho_students?.mobile || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium break-all">
              {application.zoho_students?.email || "N/A"}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">University Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium">
              {application.zoho_universities?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sector</div>
            <div className="font-medium">
              {application.zoho_universities?.sector || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Country</div>
            <div className="font-medium">
              {application.zoho_universities?.zoho_countries?.name || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">City</div>
            <div className="font-medium">
              {application.zoho_universities?.zoho_cities?.name || "N/A"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
