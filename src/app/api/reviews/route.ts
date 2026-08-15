import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

const ipReviewTracker = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REVIEWS_PER_MINUTE = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipReviewTracker.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REVIEWS_PER_MINUTE) {
    return true;
  }

  validTimestamps.push(now);
  ipReviewTracker.set(ip, validTimestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      software_id,
      software_slug,
      reviewer_name,
      reviewer_role,
      rating,
      title,
      review_body,
      locale = "en",
      _hp,
      _ts,
    } = body;

    // 1. Honeypot check
    if (_hp && String(_hp).trim() !== "") {
      return NextResponse.json({ success: true, fake: true });
    }

    // 2. Velocity check (humans take at least 2 seconds to write a review)
    if (_ts) {
      const elapsed = Date.now() - Number(_ts);
      if (elapsed < 1500) {
        return NextResponse.json({ success: true, fake: true });
      }
    }

    // 3. Validation
    if (!software_id || !reviewer_name || !rating || !review_body) {
      return NextResponse.json(
        { error: "Please fill in all required fields (Name, Rating, and Review)." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }

    // 4. IP Rate Limit
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many review submissions. Please wait a moment." },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // 5. Insert review into Supabase
    const { data: newReview, error: insertError } = await (supabase as any)
      .from("reviews")
      .insert({
        software_id,
        reviewer_name: String(reviewer_name).trim().slice(0, 80),
        reviewer_role: reviewer_role ? String(reviewer_role).trim().slice(0, 80) : null,
        rating: numRating,
        title: title ? String(title).trim().slice(0, 150) : null,
        body: String(review_body).trim().slice(0, 2000),
        locale,
        source: "appalter_user",
        is_verified: true,
        is_featured: false,
        helpful_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API] Review insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    // Revalidate software review cache if software_slug provided
    if (software_slug) {
      revalidateTag(`reviews-${software_id}`);
      revalidateTag(`software-${software_slug}`);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error("[API] Review submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
