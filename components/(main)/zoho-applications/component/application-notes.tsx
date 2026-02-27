"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InfoGraphic from "@/components/ui/info-graphic";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { zohoApplicationNotesService } from "@/modules/zoho-applications/services/zoho-application-notes-service";
import { useAuth } from "@/context/AuthContext";
import { markApplicationNotesAsRead } from "@/supabase/actions/db-actions";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import parse from "html-react-parser";

type Props = {
  applicationId: string;
  onCountChange?: (count: number) => void;
};

export default function ApplicationNotes({
  applicationId,
  onCountChange,
}: Props) {
  const { userProfile } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const userDisplayName = useMemo(() => {
    const first = userProfile?.first_name || "";
    const last = userProfile?.last_name || "";
    const full = `${first} ${last}`.trim();
    return full || userProfile?.email || "User";
  }, [userProfile]);
  const unreadCount = notes.filter((n) => !n.is_read).length;

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setNotesLoading(true);
        const rows =
          await zohoApplicationNotesService.listByApplicationId(applicationId);
        setNotes(rows);
        if (onCountChange) onCountChange(rows.length);
      } catch (e) {
        console.error(e);
      } finally {
        setNotesLoading(false);
      }
    };
    if (applicationId) loadNotes();
  }, [applicationId, onCountChange]);

  const handleSend = async () => {
    if (!noteContent.trim()) return;
    try {
      setSendingNote(true);
      const created = await zohoApplicationNotesService.createNote({
        id: crypto.randomUUID(),
        application_id: applicationId,
        title: userDisplayName,
        content: noteContent,
        user_type: "agent",
        is_read: true,
      });
      setNotes((prev) => [created, ...prev]);
      if (onCountChange) onCountChange(notes.length + 1);
      setNoteContent("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add note");
    } finally {
      setSendingNote(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      await markApplicationNotesAsRead(applicationId);
      setNotes((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notes marked as read");
    } catch (e) {
      console.error(e);
      toast.error("Failed to mark as read");
    } finally {
      setMarkingAsRead(false);
    }
  };

  return (
    <Card className="shadow-sm gap-4">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Notes
            <Badge
              variant={unreadCount > 0 ? "default" : "outline"}
              className="ml-1"
            >
              {unreadCount} unread
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={markingAsRead}
              >
                {markingAsRead ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border bg-background">
            <Textarea
              placeholder="Write a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px] resize-y rounded-b-none border-0 border-b"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (!sendingNote && noteContent.trim()) handleSend();
                }
              }}
            />
            <div className="flex items-center justify-between p-2">
              <div className="text-xs text-muted-foreground">
                Press Ctrl/⌘ + Enter to send
              </div>
              <Button
                variant="default"
                onClick={handleSend}
                disabled={sendingNote || !noteContent.trim()}
              >
                {sendingNote ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {sendingNote ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {notesLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading notes…
              </div>
            ) : notes.length === 0 ? (
              <InfoGraphic
                icon={<FileText className="!w-16 !h-16 text-primary" />}
                title="No notes found"
                description="There are no notes found for this application."
                isLeftArrow={false}
                gradient={false}
              />
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 items-start p-3 rounded-md border ${
                    n.is_read
                      ? "bg-background border-muted hover:bg-muted"
                      : "bg-primary/5 border-primary/30 border-l-4 hover:bg-primary/10"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={generateNameAvatar(n.title || "")} />
                    <AvatarFallback>
                      {(n.title?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate flex items-center gap-2">
                        <span>{n.title || "Untitled"}</span>
                        {!n.is_read ? (
                          <Badge variant="default" className="h-5 px-2">
                            Unread
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-5 px-2">
                            Read
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {n.user_type || "User"}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {parse(n.content || "")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
