import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

// We use the Service Role Key here exclusively to bypass Row Level Security 
// since this is a secure server-side webhook that requires Admin privileges.
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// N8N Webhook that receives the created/updated user notification
const N8N_WEBHOOK_URL = "https://n8n.browserautomations.com/webhook/79f1a8bd-8f9f-4bb8-a9eb-6c38534d9d34";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Webhook payload received:", payload);
    const { crm_id, full_name, is_active, profile, email } = payload;
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const password = email.split("@")[0];

    // 1️⃣ Check if user already exists
    const { data: existing, error: searchErr } = await supabaseAdmin
      .from("user_profile")
      .select("id, email, crm_id")
      .eq("crm_id", crm_id)
      .maybeSingle();

    if (searchErr) throw searchErr;

    if (existing) {
      // Check if email changed
      if (existing.email !== email) {
        // Update in Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          email,
        });
        if (authError) throw authError;
      }

      // Update in user_profile
      const { error: updateErr } = await supabaseAdmin.from("user_profile").update({
        full_name,
        is_active: is_active?.toLowerCase() === "active agent",
        profile,
        email, 
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);

      if (updateErr) throw updateErr;

      // 🔥 Notify N8N
      try {
        const n8nPayload = { id: existing.id, crm_id };
        const n8nRes = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload),
        });
        if (!n8nRes.ok) console.error("❌ N8N update webhook failed:", await n8nRes.text());
        else console.log("✅ N8N webhook (update) sent successfully");
      } catch (n8nErr) {
        console.error("❌ Error calling N8N on update:", n8nErr);
      }

      return NextResponse.json({ id: existing.id, updated: true });
    }

    // 2️⃣ Create new user in Supabase Auth
    const { data: newUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authErr) throw authErr;
    const userId = newUser.user.id;

    // 3️⃣ Insert into user_profile
    const { error: insertErr } = await supabaseAdmin.from("user_profile").insert({
      id: userId,
      email,
      crm_id,
      full_name,
      is_active: is_active?.toLowerCase() === "active agent",
      profile,
      role_id: "39c079b4-c327-4c58-9202-d53cd560820f", // The fixed Role ID from original logic
      first_name: full_name?.split(" ")[0] || "",
      last_name: full_name?.split(" ")[1] || "",
      agency_id: userId,
    });

    if (insertErr) throw insertErr;

    // 🔥 Notify N8N on create
    try {
      const n8nPayload = { id: userId, crm_id };
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
      });
      if (!n8nRes.ok) console.error("❌ N8N create webhook failed:", await n8nRes.text());
      else console.log("✅ N8N webhook (create) sent successfully");
    } catch (n8nErr) {
      console.error("❌ Error calling N8N on create:", n8nErr);
    }

    return NextResponse.json({ id: userId, created: true }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error running webhook:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
