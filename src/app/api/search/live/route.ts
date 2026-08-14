// src/app/api/search/live/route.ts
// Anlık arama (Live Search / Autocomplete) API Endpoint.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const locale = searchParams.get("locale") || "en";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("invalid-domain")) {
      return NextResponse.json({ softwares: [], categories: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!query) {
      // Return featured/trending when query is empty
      const [softwaresRes, categoriesRes] = await Promise.all([
        supabase
          .from("softwares")
          .select("id, slug, name, tagline, logo_url, avg_rating, review_count, starting_price, is_featured")
          .eq("status", "published")
          .order("is_featured", { ascending: false })
          .order("view_count", { ascending: false })
          .limit(5),
        supabase
          .from("categories")
          .select("id, slug, name, icon_url, software_count")
          .eq("is_active", true)
          .order("software_count", { ascending: false })
          .limit(4),
      ]);

      return NextResponse.json(
        {
          softwares: softwaresRes.data || [],
          categories: categoriesRes.data || [],
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    // Search query provided
    const [softwaresRes, categoriesRes] = await Promise.all([
      supabase
        .from("softwares")
        .select("id, slug, name, tagline, logo_url, avg_rating, review_count, starting_price, is_featured")
        .eq("status", "published")
        .ilike("name", `%${query}%`)
        .order("is_featured", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(6),
      supabase
        .from("categories")
        .select("id, slug, name, icon_url, software_count")
        .eq("is_active", true)
        .ilike("name", `%${query}%`)
        .limit(3),
    ]);

    return NextResponse.json(
      {
        softwares: softwaresRes.data || [],
        categories: categoriesRes.data || [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Live search error:", error);
    return NextResponse.json({ softwares: [], categories: [] }, { status: 500 });
  }
}
