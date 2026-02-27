
import { ZohoApplication } from "@/types/types";

// N8n webhook URLs
const CREATE_WEBHOOK_URL = "https://automation.sitconnect.net/webhook/4615d5ae-b3ba-413f-980e-a30a48be3c00";
const UPDATE_WEBHOOK_URL = "";
const DELETE_WEBHOOK_URL = ""; // Reusing student delete webhook as no specific one was provided
const UPLOAD_ATTACHMENT_WEBHOOK_URL = "https://automation.sitconnect.net/webhook/58e479b5-ea43-42ee-abdd-b50815dfa4d9";
const DOWNLOAD_ATTACHMENT_WEBHOOK_URL = "https://automation.sitconnect.net/webhook/13eca8cf-8742-4351-9ae6-eaace4fa10ce";
/**
 * Create application via n8n webhook
 */
export async function createApplicationViaWebhook(applicationData: Partial<ZohoApplication>) {
  try {
    const response = await fetch(CREATE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to create application via webhook");
    }
    
    return data;
  } catch (error) {
    console.error("Error in createApplicationViaWebhook:", error);
    throw error;
  }
}

/**
 * Update application via n8n webhook
 */
export async function updateApplicationViaWebhook(applicationData: Partial<ZohoApplication>) {
  try {
    const response = await fetch(UPDATE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to update application via webhook");
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateApplicationViaWebhook:", error);
    throw error;
  }
}

/**
 * Delete application via n8n webhook
 */
export async function deleteApplicationViaWebhook(applicationId: string) {
  try {
    const response = await fetch(DELETE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: applicationId }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to delete application via webhook");
    }
    
    return data;
  } catch (error) {
    console.error("Error in deleteApplicationViaWebhook:", error);
    throw error;
  }
}

/**
 * Trigger n8n to download an attachment for an application.
 * Looks up attachment id from public.zoho_attachments by module_id = applicationId
 */
export async function downloadApplicationAttachment(applicationId: string, type:string) {

  try {
    const webhookUrl = DOWNLOAD_ATTACHMENT_WEBHOOK_URL;
    // Query Supabase for an attachment linked to this application
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/zoho_attachments?module_id=eq.${applicationId}&select=id,name`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error(`Attachment lookup failed: ${res.status}`);
    }
    const rows: { id: string, name: string }[] = await res.json();
    const attachmentId = rows?.find((row) => row.name === type)?.id;

    const payload = {
      id: attachmentId || applicationId, // fallback to record id if none stored yet
      module_id: applicationId,
    };

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!webhookRes.ok) {
      throw new Error(`n8n download webhook failed: ${webhookRes.status}`);
    }
    const webhookData = await webhookRes.json();
    return webhookData;
  } catch (error) {
    console.error('Error in downloadApplicationAttachment:', error);
    throw error;
  }
}


export async function uploadApplicationAttachment(applicationId: string, type:string, fileUrl: string) {
  try {
    const webhookUrl = UPLOAD_ATTACHMENT_WEBHOOK_URL;
   const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: applicationId, file_url: fileUrl, type }),
    });
    if(!res.ok) {
      throw new Error("Webhook upload failed");
    }
    return res.json();
  } catch (error) {
    console.error("Error in uploadApplicationAttachment via webhook:", error);
    throw error;
  }
}
