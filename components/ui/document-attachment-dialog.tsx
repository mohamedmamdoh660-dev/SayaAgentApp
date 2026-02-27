"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/utils/format-file-size";
import { saveFile } from "@/supabase/actions/save-file";

type DocumentRow = {
  attachment_type: string;
  file: File | null;
  uploading: boolean;
  size: number;
  url?: string;
};

export function DocumentAttachmentDialog({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: (
    docs: Array<{ type: string; url: string; filename: string; size: number }>
  ) => void;
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>([
    { attachment_type: "", file: null, uploading: false, size: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const attachmentTypes = [
    "Passport",
    "HighSchool Transcript",
    "Diploma",
    "English Skills",
    "Motivation Letter",
    "Recommendation Letter",
  ];

  const addRow = () =>
    setDocuments((d) => [
      ...d,
      { attachment_type: "", file: null, uploading: false, size: 0 },
    ]);
  const removeRow = (i: number) =>
    setDocuments((d) => (d.length > 1 ? d.filter((_, idx) => idx !== i) : d));
  const setType = (i: number, type: string) =>
    setDocuments((d) =>
      d.map((r, idx) => (idx === i ? { ...r, attachment_type: type } : r))
    );

  const handleFile = async (i: number, file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document size must be less than 5MB");
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowed.includes(file.type)) {
      toast.error(
        "Please select a valid document file (PDF, DOC, DOCX, JPG, PNG)"
      );
      return;
    }
    setDocuments((d) =>
      d.map((r, idx) => (idx === i ? { ...r, uploading: true } : r))
    );
    try {
      const url = await saveFile(file);
      if (!url) throw new Error("Failed to upload document");
      setDocuments((d) =>
        d.map((r, idx) =>
          idx === i ? { ...r, file, url, size: file.size, uploading: false } : r
        )
      );
      toast.success(`${file.name} uploaded`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
      setDocuments((d) =>
        d.map((r, idx) => (idx === i ? { ...r, uploading: false } : r))
      );
    }
  };

  const handleSubmit = async () => {
    const valid = documents.filter((d) => d.attachment_type && d.url);
    if (valid.length === 0) {
      toast.error("Please add at least one document");
      return;
    }
    setSubmitting(true);
    try {
      onUploaded?.(
        valid.map((d) => ({
          type: d.attachment_type,
          url: d.url!,
          filename: d.file?.name || "",
          size: d.size,
        }))
      );
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Document Attachments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="p-5 border-2 border-dashed rounded-lg bg-muted/10 space-y-4"
            >
              <div className="flex items-center justify-between ">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  Document {index + 1}
                </h4>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <Select
                    onValueChange={(v) => setType(index, v)}
                    value={doc.attachment_type}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {attachmentTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  {doc.file && doc.url ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900">
                      <div className="w-10 h-10 rounded-md bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 dark:text-green-300">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 truncate">
                          {doc.file.name}
                        </p>
                        {(doc.file.size || doc.size) && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {formatFileSize(doc.file.size || doc.size)}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url!, "_blank")}
                        className="h-8 px-2 text-xs"
                      >
                        View
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors w-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="w-full flex flex-col items-center justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={doc.uploading}
                            className="flex items-center gap-2 w-[200px]"
                            onClick={() => {
                              if (!doc.attachment_type) {
                                toast.error(
                                  "Please select a document type first"
                                );
                                return;
                              }
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                              input.onchange = (e) => {
                                const file =
                                  (e.target as HTMLInputElement).files?.[0] ||
                                  null;
                                handleFile(index, file);
                              };
                              input.click();
                            }}
                          >
                            {doc.uploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                Choose Document
                                <Upload className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2">
                            PDF, DOC, DOCX, JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="w-full border-dashed border-2 py-6"
          >
            <Upload className="h-4 w-4 mr-2" /> Add Another Document
          </Button>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
