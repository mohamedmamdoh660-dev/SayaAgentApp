import { executeGraphQL } from "@/lib/graphql-client";
import { QUERY_ATTACHMENTS_BY_MODULE_AND_ID, QUERY_ATTACHMENTS_BY_MODULE_ID } from "@/modules/zoho-attachments/graphql/zoho-attachments.graphql";
import { ZohoAttachment } from "@/types/types";

type CollectionResp = {
  zoho_attachmentsCollection: { edges: { node: ZohoAttachment }[] };
};

class ZohoAttachmentsService {
  async getByModuleAndId(module: string, moduleId: string): Promise<ZohoAttachment[]> {
    const data = await executeGraphQL<CollectionResp>(QUERY_ATTACHMENTS_BY_MODULE_AND_ID, {
      module,
      module_id: moduleId,
    });
    return data?.zoho_attachmentsCollection?.edges?.map((e) => e.node) || [];
  }

  async getByModuleId(moduleId: string): Promise<ZohoAttachment[]> {
    const data = await executeGraphQL<CollectionResp>(QUERY_ATTACHMENTS_BY_MODULE_ID, {
      module_id: moduleId,
    });
    return data?.zoho_attachmentsCollection?.edges?.map((e) => e.node) || [];
  }
}

export const zohoAttachmentsService = new ZohoAttachmentsService();


