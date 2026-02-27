import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("record_id");
    const type = searchParams.get("type");

    if (!recordId || !type) {
      return new Response(JSON.stringify({ error: "Missing record_id or type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup attachment id by module_id (record id) and optional name match
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/zoho_attachments?module_id=eq.${encodeURIComponent(
        recordId
      )}&select=id,name`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Attachment lookup failed: ${res.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows: { id: string; name: string }[] = await res.json();
    const found = rows.find((r) => r.name.toLowerCase().includes(type.toLowerCase())) ;

    if(!found) {
      return new Response(JSON.stringify({ error: "Attachment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
      const attachmentId = found?.id || recordId;

    // Call n8n webhook to fetch the actual file content
    const webhookUrl =
      "https://automation.sitconnect.net/webhook/13eca8cf-8742-4351-9ae6-eaace4fa10ce";

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: attachmentId, module_id: recordId }),
    });

    if (!webhookRes.ok) {
      return new Response(JSON.stringify({ error: `n8n webhook failed: ${webhookRes.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use buffer and stream back to the browser
    // @ts-ignore - buffer is available in Node runtime
    const buffer = await (webhookRes as any).buffer?.();
    const arrayBuffer = buffer ? buffer : await webhookRes.arrayBuffer();

    const filename = found?.name || "attachment.pdf";
    const contentType = webhookRes.headers.get("content-type") || "application/pdf";

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


