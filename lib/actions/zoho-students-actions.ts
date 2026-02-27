
import { ZohoStudent } from "@/types/types";

// N8n webhook URLs
const CREATE_WEBHOOK_URL = "https://automation.sitconnect.net/webhook/da599eaf-7f5e-45aa-9d53-33d1f185515a";
const EDIT_WEBHOOK_URL = "";
const DELETE_WEBHOOK_URL = "";

/**
 * Create student via n8n webhook
 */
export async function createStudentViaWebhook(studentData: Partial<ZohoStudent>) {
  try {
    const response = await fetch(CREATE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to create student via webhook");
    }
    
    return data;
  } catch (error) {
    console.error("Error in createStudentViaWebhook:", error);
    throw error;
  }
}

/**
 * Update student via n8n webhook
 */
export async function updateStudentViaWebhook(studentData: Partial<ZohoStudent>) {
  try {
    const response = await fetch(EDIT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to update student via webhook");
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateStudentViaWebhook:", error);
    throw error;
  }
}

/**
 * Delete student via n8n webhook
 */
export async function deleteStudentViaWebhook(studentId: string) {
  try {
    const response = await fetch(DELETE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: studentId }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to delete student via webhook");
    }
    
    return data;
  } catch (error) {
    console.error("Error in deleteStudentViaWebhook:", error);
    throw error;
  }
}
