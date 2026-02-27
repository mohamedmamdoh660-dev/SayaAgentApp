"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZohoAnnouncement } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  BellRing,
  CalendarDays,
  GraduationCap,
  Pencil,
  Trash,
} from "lucide-react";
import { announcementsService } from "@/modules/announcements/services/announcements-service";
import { toast } from "sonner";
import EditAnnouncementDialog from "./edit-announcement";

interface AnnouncementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: ZohoAnnouncement | null;
  onRefresh?: () => void;
}

export default function AnnouncementDetailDialog({
  open,
  onOpenChange,
  announcement,
  onRefresh,
}: AnnouncementDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<ZohoAnnouncement | null>(null);

  // Set current announcement when the prop changes
  useEffect(() => {
    setCurrentAnnouncement(announcement);
  }, [announcement]);

  const handleDelete = async () => {
    if (!currentAnnouncement) return;

    if (confirm("Are you sure you want to delete this announcement?")) {
      setIsDeleting(true);
      try {
        await announcementsService.deleteAnnouncement(currentAnnouncement.id);
        toast.success("Announcement deleted successfully");
        onOpenChange(false);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "general":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            General
          </Badge>
        );
      case "admission":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Admission
          </Badge>
        );
      case "academic":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
            Academic
          </Badge>
        );
      case "event":
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            Event
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200">
            Other
          </Badge>
        );
    }
  };

  if (!currentAnnouncement) return null;

  const universityName = currentAnnouncement.zoho_universities?.name || "N/A";
  const universityLogo = currentAnnouncement.zoho_universities?.logo;
  const programName = currentAnnouncement.zoho_programs?.name || "N/A";
  const createdAt = currentAnnouncement.created_at
    ? format(new Date(currentAnnouncement.created_at), "PPpp")
    : "N/A";
  const updatedAt = currentAnnouncement.updated_at
    ? format(new Date(currentAnnouncement.updated_at), "PPpp")
    : null;

  const universityInitials = universityName
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              {getCategoryBadge(currentAnnouncement.category)}
            </div>
            <DialogTitle className="text-xl">
              {currentAnnouncement.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Created: {createdAt}</span>
              {updatedAt && (
                <span className="ml-2">(Updated: {updatedAt})</span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={universityLogo || ""}
                    alt={universityName}
                  />
                  <AvatarFallback>{universityInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{universityName}</div>
                  {currentAnnouncement.program && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>{programName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line">
                    {currentAnnouncement.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditAnnouncementDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open && onRefresh) onRefresh();
        }}
        announcement={currentAnnouncement}
        onRefresh={onRefresh}
      />
    </>
  );
}
