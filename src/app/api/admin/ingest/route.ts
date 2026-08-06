import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, payload } = body;

    const validSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET || 'dev-secret';

    if (secret !== validSecret && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (!payload || !Array.isArray(payload)) {
      return NextResponse.json({ message: "Payload must be an array of software objects" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Ingest payload into softwares table
    // Assuming payload matches the 'softwares' table structure
    const { data, error } = await supabase
      .from("softwares")
      .upsert(payload, { onConflict: "slug" })
      .select("id, slug");

    if (error) {
      console.error("[Ingest Error]", error);
      return NextResponse.json({ message: "Error ingesting data", error: error.message }, { status: 500 });
    }

    // Revalidate the general lists and specific slugs
    revalidateTag("softwares");
    revalidateTag("search");
    revalidateTag("categories");

    data?.forEach((sw: { slug: string }) => {
      revalidateTag(`software-${sw.slug}`);
    });

    return NextResponse.json({ 
      message: "Data ingested successfully", 
      count: data?.length || 0,
      revalidated: true 
    });
  } catch (err: any) {
    console.error("[Ingest Catch Error]", err);
    return NextResponse.json({ message: "Internal Server Error", error: err.message }, { status: 500 });
  }
}
