import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const supabase = createAdminClient();

    // 1. Get the software's website_url and id
    const { data: software, error } = await (supabase as any)
      .from("softwares")
      .select("id, website_url")
      .eq("slug", slug)
      .single();

    if (error || !software || !software.website_url) {
      // Fallback if not found or no URL
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 2. Track the click
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Fire and forget (don't await so we don't slow down the redirect)
    (supabase as any).from("outbound_clicks").insert({
      software_id: software.id,
      ip_hash: ipHash,
    }).then(({ error: insertError }: any) => {
      if (insertError) {
        console.error("[API/go] Click track error:", insertError);
      }
    });

    // 3. Redirect to the target URL (302 Temporary Redirect is best for SEO affiliate links)
    return NextResponse.redirect(software.website_url, 302);
  } catch (error) {
    console.error("[API/go] Route error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
