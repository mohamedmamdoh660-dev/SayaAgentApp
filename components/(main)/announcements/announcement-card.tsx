"use client";

import { ZohoAnnouncement } from "@/types/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { BellRing, CalendarDays, GraduationCap, School } from "lucide-react";

import { useState } from "react";
import { announcementsService } from "@/modules/announcements/services/announcements-service";
import { toast } from "sonner";
import EditAnnouncementDialog from "./component/edit-announcement";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { useRouter } from "next/navigation";

interface AnnouncementCardProps {
  announcement: ZohoAnnouncement;
  onRefresh?: () => void;
  onView?: (announcement: ZohoAnnouncement) => void;
}

export default function AnnouncementCard({
  announcement,
  onRefresh,
  onView,
}: AnnouncementCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setIsDeleting(true);
      try {
        await announcementsService.deleteAnnouncement(announcement.id);
        toast.success("Announcement deleted successfully");
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const universityName = announcement.zoho_universities?.name || "N/A";
  const universityLogo = announcement.zoho_universities?.logo;
  const programName = announcement.zoho_programs?.name || "N/A";
  const createdAt = announcement.created_at
    ? formatDistanceToNow(new Date(announcement.created_at), {
        addSuffix: true,
      })
    : "N/A";

  const universityInitials = universityName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <CardTitle className="line-clamp-2">{announcement.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />
              {createdAt}
            </CardDescription>
          </div>
          <Badge
            className="bg-blue-50 text-blue-700 border-blue-200 
             dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
          >
            {announcement.category}
          </Badge>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {announcement.description}
          </p>
        </CardContent>
        <CardFooter className="pt-2 border-t flex flex-col gap-2 items-start">
          <div className="flex items-center gap-2 w-full">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={universityLogo || generateNameAvatar(universityName)}
                alt={universityName}
              />
              <AvatarFallback>{universityInitials}</AvatarFallback>
            </Avatar>
            <span
              className="text-sm font-medium line-clamp-1"
              title={universityName}
              onClick={() =>
                router.push(
                  `/universities/${announcement.zoho_universities?.id}`
                )
              }
            >
              {universityName}
            </span>
          </div>
          {announcement.program && (
            <div className="flex items-center gap-2 w-full">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground line-clamp-1">
                {programName}
              </span>
            </div>
          )}
        </CardFooter>
      </Card>

      <EditAnnouncementDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        announcement={announcement}
        onRefresh={onRefresh}
      />
    </>
  );
}
