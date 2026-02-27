import { executeGraphQLBackend } from "@/lib/graphql-server";
import {
  GET_APPLICATION_NOTES,
  INSERT_APPLICATION_NOTE,
  MARK_APPLICATION_NOTES_READ,
} from "./zoho-application-notes-graphql";

export type ApplicationNote = {
  id: string;
  created_at: string;
  content: string | null;
  user_type: string | null;
  application_id: string | null;
  title: string | null;
  is_read: boolean | null;
};

class ZohoApplicationNotesService {
  async listByApplicationId(applicationId: string, limit = 50, offset = 0) {
    const data = await executeGraphQLBackend(GET_APPLICATION_NOTES, {
      application_id: applicationId,
      limit,
      offset,
    });
    return (
      data?.zoho_application_notesCollection?.edges?.map((e: any) => e.node) ||
      []
    ) as ApplicationNote[];
  }

  async createNote(note: Partial<ApplicationNote>) {
    const data = await executeGraphQLBackend(INSERT_APPLICATION_NOTE, {
      objects: [note],
    });
    return data?.insertIntozoho_application_notesCollection?.records?.[0] as ApplicationNote;
  }

  async markAllRead(applicationId: string) {
    const data = await executeGraphQLBackend(MARK_APPLICATION_NOTES_READ, {
      application_id: applicationId,
    });
    return data?.updatezoho_application_notesCollection?.records as Array<{
      id: string;
      is_read: boolean;
    }>;
  }
}

export const zohoApplicationNotesService = new ZohoApplicationNotesService();


