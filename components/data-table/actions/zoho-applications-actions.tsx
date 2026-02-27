"use client";

import React, { useState } from "react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Ellipsis,
  Edit,
  Trash,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ResourceType, ZohoApplication } from "@/types/types";
import { zohoApplicationsService } from "@/modules/zoho-applications/services/zoho-applications-service";
import {
  deleteApplicationViaWebhook,
  updateApplicationViaWebhook,
} from "@/lib/actions/zoho-applications-actions";
import ConfirmationDialogBox from "@/components/ui/confirmation-dialog-box";
import EditZohoApplication from "@/components/(main)/zoho-applications/component/edit-zoho-application";
import { useAuth } from "@/context/AuthContext";
import { canDelete, canEdit } from "@/lib/permissions";
// import EditZohoApplication from "@/components/(main)/zoho-applications/component/edit-zoho-application";

interface ZohoApplicationsTableRowActionsProps {
  row: Row<ZohoApplication>;
  fetchApplications: () => void;
}

export function ZohoApplicationsTableRowActions({
  row,
  fetchApplications,
}: ZohoApplicationsTableRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: "delete" | "complete" | "pending" | "fail" | null;
  }>({ isOpen: false, action: null });

  const values: ZohoApplication = { ...row.original };

  const handleConfirmation = (
    action: "delete" | "complete" | "pending" | "fail"
  ) => {
    setConfirmationDialog({ isOpen: true, action });
  };

  const onConfirm = async () => {
    if (!values?.id) {
      return;
    }
    try {
      setLoading(true);
      const action = confirmationDialog.action;

      if (action === "delete") {
        // First call the n8n webhook
        const webhookResponse = await deleteApplicationViaWebhook(values.id);

        if (webhookResponse.status) {
          // If webhook was successful, then delete from database
          await zohoApplicationsService.deleteApplication(values.id);
          toast.success("Application deleted successfully");
        } else {
          throw new Error(
            webhookResponse.message ||
              "Failed to delete application via webhook"
          );
        }
      } else if (action === "complete") {
        const updateData = {
          id: values.id,
          stage: "completed",
        };

        // First call the n8n webhook
        const webhookResponse = await updateApplicationViaWebhook(updateData);

        if (webhookResponse.status) {
          await zohoApplicationsService.updateApplication(updateData);
          toast.success("Application marked as completed");
        } else {
          throw new Error(
            webhookResponse.message ||
              "Failed to update application via webhook"
          );
        }
      } else if (action === "pending") {
        const updateData = {
          id: values.id,
          stage: "pending",
        };

        // First call the n8n webhook
        const webhookResponse = await updateApplicationViaWebhook(updateData);

        if (webhookResponse.status) {
          await zohoApplicationsService.updateApplication(updateData);
          toast.success("Application marked as pending");
        } else {
          throw new Error(
            webhookResponse.message ||
              "Failed to update application via webhook"
          );
        }
      } else if (action === "fail") {
        const updateData = {
          id: values.id,
          stage: "failed",
        };

        // First call the n8n webhook
        const webhookResponse = await updateApplicationViaWebhook(updateData);

        if (webhookResponse.status) {
          await zohoApplicationsService.updateApplication(updateData);
          toast.success("Application marked as failed");
        } else {
          throw new Error(
            webhookResponse.message ||
              "Failed to update application via webhook"
          );
        }
      }

      setConfirmationDialog({ isOpen: false, action: null });
      fetchApplications(); // Refresh the application list after action
    } catch (error: any) {
      toast.error(error?.message || "Unknown error");
    } finally {
      setLoading(false);
      setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const { userProfile } = useAuth();
  const isCrmId = userProfile?.crm_id || userProfile?.agency?.crm_id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          {canEdit(userProfile, ResourceType.APPLICATIONS) && (
            <DropdownMenuItem
              onClick={() => {
                setIsEditDialogOpen(true);
              }}
              className="cursor-pointer flex items-center"
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          {canDelete(userProfile, ResourceType.APPLICATIONS) && (
            <DropdownMenuItem
              onClick={() => handleConfirmation("delete")}
              className="cursor-pointer flex items-center"
            >
              <Trash className="mr-1 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          )}

          {/* <DropdownMenuItem
            onClick={() => handleConfirmation("complete")}
            className="cursor-pointer flex items-center"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Mark as Completed
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleConfirmation("pending")}
            className="cursor-pointer flex items-center"
          >
            <Clock className="mr-1 h-4 w-4" />
            Mark as Pending
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleConfirmation("fail")}
            className="cursor-pointer flex items-center"
          >
            <AlertCircle className="mr-1 h-4 w-4" />
            Mark as Failed
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditDialogOpen && (
        <EditZohoApplication
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          applicationData={values}
          fetchApplications={fetchApplications}
        />
      )}

      <ConfirmationDialogBox
        title={
          confirmationDialog.action === "delete"
            ? `Are you sure you want to delete this application?`
            : confirmationDialog.action === "complete"
              ? `Are you sure you want to mark this application as completed?`
              : confirmationDialog.action === "pending"
                ? `Are you sure you want to mark this application as pending?`
                : `Are you sure you want to mark this application as failed?`
        }
        description={
          confirmationDialog.action === "delete"
            ? `This action cannot be undone. This will permanently delete the selected application.`
            : `This will change the status of the application.`
        }
        cancelText="Cancel"
        confirmText={
          confirmationDialog.action === "delete"
            ? "Delete"
            : confirmationDialog.action === "complete"
              ? "Mark as Completed"
              : confirmationDialog.action === "pending"
                ? "Mark as Pending"
                : "Mark as Failed"
        }
        isOpen={confirmationDialog.isOpen}
        setIsOpen={(isOpen: boolean) =>
          setConfirmationDialog((prev) => ({ ...prev, isOpen }))
        }
        loading={loading}
        onConfirm={onConfirm}
        icon={
          confirmationDialog.action === "delete" ? (
            <Trash className="mr-2 h-4 w-4" />
          ) : confirmationDialog.action === "complete" ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : confirmationDialog.action === "pending" ? (
            <Clock className="mr-2 h-4 w-4" />
          ) : (
            <AlertCircle className="mr-2 h-4 w-4" />
          )
        }
      />
    </>
  );
}
