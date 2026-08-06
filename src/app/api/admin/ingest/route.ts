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

    // Fetch categories to map slug -> id
    const { data: categories } = await supabase.from('categories').select('id, slug');
    const categoryMap = new Map();
    categories?.forEach((c: any) => categoryMap.set(c.slug, c.id));

    // Clean payload and map category_id
    const cleanedPayload = payload.map((item: any) => {
      let category_id = null;
      if (item.category_slug && categoryMap.has(item.category_slug)) {
        category_id = categoryMap.get(item.category_slug);
      }
      
      return {
        slug: item.slug,
        name: item.name,
        tagline: item.tagline || null,
        description: item.description || null,
        short_description: item.short_description || null,
        starting_price: item.starting_price || null,
        price_currency: item.price_currency || "USD",
        is_featured: item.is_featured || false,
        is_sponsored: item.is_sponsored || false,
        category_id
      };
    });

    // Ingest payload into softwares table
    const { data, error } = await supabase
      .from("softwares")
      .upsert(cleanedPayload as any, { onConflict: "slug" })
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
