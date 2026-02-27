import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmationDialogBoxProps {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  loading?: boolean;
  type?: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  countdown?: number | null;
  countdownLabel?: string;
}

const ConfirmationDialogBox = ({
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Confirm",
  onConfirm,
  isOpen,
  setIsOpen,
  loading = false,
  type,
  icon,
  content,
  countdown,
  countdownLabel,
}: ConfirmationDialogBoxProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {content && <div className="text-sm text-muted-foreground">{content}</div>}
        {loading && typeof countdown === "number" && countdown >= 0 && (
          <div className="mt-4 rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            {countdownLabel || "Processing"}... {countdown}s
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={
              type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              <>
                {icon}
                {confirmText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialogBox;
