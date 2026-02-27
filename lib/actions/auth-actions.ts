"use server";

import { emailService } from "../email-service";
import { supabase, supabaseClient } from "../supabase-auth-client";
import crypto from "crypto";

/**
 * Delete a user from Supabase auth
 * This must be run as a server action
 */
export async function deleteAuthUser(userId: string, type: string) {
  try {
    let error: any = null;
    let data: any = null;   
    // First check if user exists in auth
    if(type === 'user'){
      const { data: user, error: checkError } = await supabase.auth.admin.deleteUser(userId);
      error = checkError;
      data = user;
    } 


    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // If user doesn't exist in auth, return success (already deleted)
    if (!data) {
      return { success: true, message: "User not found in auth, already deleted." };
    }
    
  
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting auth user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error deleting auth user" 
    };
  }
}

/**
 * Create a new user in Supabase auth
 * This must be run as a server action
 */
  export async function createAuthUser(email: string, password: string, metadata: object = {}, type: string) {
  try {
    let error: any = null;
    let data: any = null;
    if(type === 'user'){
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    error = userError;
    data = userData;
  } 
    if (error) {
      console.error("Error creating auth user:", error);
      return { success: false, error: error.message, user: null };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Unexpected error creating auth user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating auth user",
      user: null
    };
  }
} 


/**
 * Request a password reset: generates a token, stores it, and sends an email
 */
export async function requestPasswordReset(email: string, type: string) {
  try {
    // 1. Find user by email
    let userId: string | null = null;
    if (type === "user") {
      const { data, error } = await supabaseClient.from("user_profile").select("id").eq("email", email).single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("User not found"); // Don't reveal
      userId = data.id;
    } 
    if (!userId) throw new Error("User not found");

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // 3. Store token in password_resets table
    const { error: insertError } = await supabase
      .from("password_resets")
      .insert({
        user_id: userId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });
    if (insertError) throw new Error(insertError.message);

    // 4. Send email with reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;
const res =   await emailService.sendEmail({
      to: email,
      subject: "Reset your password",
      html: `<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 24px; color: #202124;">
                            <!-- Icon -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; position: relative;">
                                          <img alt="✉️" aria-label="✉️" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/16.0/2709_fe0f/72.png" loading="lazy" style=" height: 49px; margin: 15px 0 0 15px;">
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <!-- Title -->
                            <h1 style="font-size: 28px; font-weight: 500; color: #202124; text-align: center; margin: 0 0 8px 0; letter-spacing: -0.5px;">Reset Your Password</h1>
                            <p style="text-align: center; font-size: 14px; color: #5f6368; margin: 0 0 24px 0;">We received a request to reset your password</p>
                            <!-- Message -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; border-radius: 0 4px 4px 0; font-size: 14px; line-height: 1.6; color: #3c4043;">
                                        Click the button below to choose a new password. If you didn’t request this, you can safely ignore this email.
                                    </td>
                                </tr>
                            </table>
                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetLink}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; border: none; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <!-- Alternative Link -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="text-align: center; font-size: 13px; color: #5f6368;">
                                        <p style="margin: 0 0 8px 0;">Or copy and paste this link in your browser:</p>
                                        <p style="margin: 0; word-break: break-all; color: #1f73e6; font-family: monospace; font-size: 12px;">${resetLink}</p>
                                    </td>
                                </tr>
                            </table>
                            <!-- Info Box -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; background-color: #e8f4f8; border: 1px solid #b3dfe0; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 16px; font-size: 13px; line-height: 1.6; color: #2c5282;">
                                        <p style="margin: 0 0 8px 0;"><strong>ℹ️ This link will expire in 1 hour</strong></p>
                                        <p style="margin: 0;">If you didn't request a password reset, please ignore this email.</p>
                                    </td>
                                </tr>
                            </table>
                            <!-- Security Tips -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; background-color: #fef7e0; border: 1px solid #f9f1ba; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 16px; font-size: 13px; line-height: 1.6; color: #3c4043;">
                                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #202124;">🔒 Safety First:</p>
                                        <ul style="margin: 0; padding-left: 20px;">
                                            <li style="margin: 6px 0;">Never share this email with anyone</li>
                                            <li style="margin: 6px 0;">We will never ask for your password via email</li>
                                            <li style="margin: 6px 0;">Keep your account secure with a strong password</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                            <!-- Quick Links -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="font-size: 12px; color: #5f6368;">
                                        <p style="margin: 0;">
                                            <a href="#" style="color: #1f73e6; text-decoration: none; margin: 0 12px;">FAQ</a>
                                            <span style="color: #dadce0;">|</span>
                                            <a href="#" style="color: #1f73e6; text-decoration: none; margin: 0 12px;">Documentation</a>
                                            <span style="color: #dadce0;">|</span>
                                            <a href="#" style="color: #1f73e6; text-decoration: none; margin: 0 12px;">Support</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr style="border-top: 1px solid #e8e8e8; background-color: #f8f9fa;">
                        <td style="padding: 16px 24px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td style="font-size: 11px; color: #9aa0a6; text-align: center;">
                                        <p style="margin: 0 0 8px 0;">© 2025 Supabase. All rights reserved.</p>
                                        <p style="margin: 0;">
                                            <a href="#" style="color: #1f73e6; text-decoration: none;">Privacy Policy</a>
                                            <span style="color: #dadce0;"> · </span>
                                            <a href="#" style="color: #1f73e6; text-decoration: none;">Terms of Service</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>`
    });
  } catch (error) {
    console.log("🚀 ~ requestPasswordReset ~ error:", error)
    throw new Error("Something went wrong, so please try again later.");
  }
}

/**
 * Reset password using a token
 */
export async function resetPassword(token: string, newPassword: string, type: string) {
  try {
    // 1. Find token in password_resets table
    const { data, error } = await supabase
      .from("password_resets")
      .select("id, user_id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Invalid or expired token");
    if (data.used_at) throw new Error("Token already used");
    if (new Date(data.expires_at) < new Date()) throw new Error("Token expired");

    // 2. Update password using Supabase admin
    if (type !== "user") throw new Error("Only user type supported");
    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user_id, { password: newPassword });
    if (updateError) throw new Error(updateError.message);

    // 3. Mark token as used
    await supabase
      .from("password_resets")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id);

  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
} 

/**
 * Update user password using admin API
 * This must be run as a server action
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating password"
    };
  }
} 