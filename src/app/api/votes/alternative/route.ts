import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { alternative_record_id, software_slug } = body;

    if (!alternative_record_id || !software_slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Hash the IP address for GDPR compliance
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    const supabase = createAdminClient();

    // 1. Insert vote
    const { error: insertError } = await supabase
      .from("alternative_votes")
      .insert({
        alternative_record_id,
        ip_hash: ipHash,
      });

    if (insertError) {
      if (insertError.code === "23505") { // Unique constraint violation
        return NextResponse.json({ error: "Already voted" }, { status: 409 });
      }
      console.error("[API] Vote insert error:", insertError);
      return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
    }

    // 2. Increment upvotes atomically
    const { error: updateError } = await supabase.rpc("increment_alternative_upvotes", {
      p_id: alternative_record_id,
    });

    if (updateError) {
      console.error("[API] Vote increment error:", updateError);
      return NextResponse.json({ error: "Failed to update count" }, { status: 500 });
    }

    // Revalidate the alternatives cache for this software
    revalidateTag(`alternatives-${software_slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
