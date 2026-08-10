import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { translateSoftwareData } from "@/lib/services/translationService";

export async function POST(request: NextRequest) {
  try {
    // We expect Supabase Database Webhooks to send a secret token in the Authorization header
    // e.g. Authorization: Bearer <your-secret-token>
    const authHeader = request.headers.get("authorization");
    
    // In Supabase, you configure the webhook to send this exact secret
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET || process.env.ADMIN_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${webhookSecret}` && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ message: "Unauthorized: Invalid secret" }, { status: 401 });
    }

    // Parse the payload from Supabase (optional: you can use it to do granular revalidation)
    const payload = await request.json();
    
    // Auto-translation logic
    if (payload.table === "softwares" && payload.type === "UPDATE") {
      const record = payload.record;
      const old = payload.old_record;
      
      const hasChanged = 
        record.name !== old?.name ||
        record.tagline !== old?.tagline ||
        record.short_description !== old?.short_description ||
        JSON.stringify(record.ai_features) !== JSON.stringify(old?.ai_features);
        
      if (hasChanged) {
        console.log(`Detected changes in English software: ${record.slug}. Translating...`);
        // We await this so the serverless function doesn't terminate early.
        await translateSoftwareData(record.id, record);
      }
    }

    // For maximum consistency and safety, any manual edit in Supabase 
    // will clear the entire site's Data Cache. 
    // Since manual edits are rare (e.g. done by an Admin in Supabase Studio),
    // this is perfectly acceptable and prevents "ghost" data on relation pages.
    
    revalidatePath("/", "layout");
    
    return NextResponse.json({ 
      revalidated: true, 
      message: "Cache successfully invalidated.",
      now: Date.now() 
    });
    
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ message: "Error processing webhook", error: err.message }, { status: 500 });
  }
}
