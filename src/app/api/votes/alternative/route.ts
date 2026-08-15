import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

// In-memory sliding window rate limiter for voting protection
const ipVoteTracker = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_VOTES_PER_MINUTE = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipVoteTracker.get(ip) || [];

  // Filter out timestamps older than window
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_VOTES_PER_MINUTE) {
    return true;
  }

  validTimestamps.push(now);
  ipVoteTracker.set(ip, validTimestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { alternative_record_id, software_slug, vote_type = 1, _hp, _ts } = body;

    // 1. Layer 1: Honeypot Trap check (automated spam bots fill this field)
    if (_hp && String(_hp).trim() !== "") {
      // Silently return success to waste bot compute without writing to DB
      return NextResponse.json({ success: true, fake: true });
    }

    // 2. Layer 2: Velocity / Interaction Timing Check (humans take at least 500ms to vote)
    if (_ts) {
      const elapsed = Date.now() - Number(_ts);
      if (elapsed < 500) {
        // Sub-500ms automated script
        return NextResponse.json({ success: true, fake: true });
      }
    }

    if (!alternative_record_id || !software_slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (vote_type !== 1 && vote_type !== -1) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // 3. Layer 3: IP Rate Limiting & SHA-256 Fingerprint
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many votes. Please wait a moment." },
        { status: 429 }
      );
    }

    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    const supabase = createAdminClient();

    // 4. Layer 4: Insert vote with DB Unique constraint on (alternative_record_id, ip_hash)
    const { error: insertError } = await (supabase as any)
      .from("alternative_votes")
      .insert({
        alternative_record_id,
        ip_hash: ipHash,
        vote_type,
      });

    if (insertError) {
      if (insertError.code === "23505") { // Unique constraint violation
        return NextResponse.json({ error: "Already voted" }, { status: 409 });
      }
      console.error("[API] Vote insert error:", insertError);
      return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
    }

    // 5. Increment upvotes/downvotes atomically
    const { error: updateError } = await (supabase as any).rpc("vote_alternative", {
      p_id: alternative_record_id,
      p_vote_type: vote_type,
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
