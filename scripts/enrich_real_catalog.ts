import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
  console.error("Missing required environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Real Data AI Features Schema
const deepAiFeaturesSchema = z.object({
  tldr: z.string().min(5).max(500),
  pros: z.array(z.string().min(1).max(350)).default([]),
  cons: z.array(z.string().min(1).max(350)).default([]),
  pricing_model_type: z.enum(["Free", "Freemium", "Paid Only", "Open Source"]),
  target_audience_size: z.string().default("General"),
  dealbreakers: z.array(z.string().min(1).max(350)).default([]),
  hidden_costs: z.array(z.string().min(1).max(350)).default([]),
  migration_difficulty: z.enum(["easy", "medium", "hard", "expert"]).default("medium"),
  best_for: z.array(z.string().min(1).max(350)).default([]),
  not_for: z.array(z.string().min(1).max(350)).default([]),
  switching_reasons: z.array(z.string().min(1).max(350)).default([]),
  key_limitations: z.array(z.string().min(1).max(350)).default([]),
  ratings: z.object({
    ease_of_use: z.number().min(1).max(5),
    price_value: z.number().min(1).max(5),
    features: z.number().min(1).max(5),
    support: z.number().min(1).max(5)
  }),
  pricing_summary: z.string().optional(),
  confidence: z.number().min(0.7).max(1.0)
});

async function enrichSoftwareItem(software: any): Promise<z.infer<typeof deepAiFeaturesSchema> | null> {
  const categoryName = software.categories?.name || software.category_slug || "SaaS";

  const prompt = `
You are a senior SaaS software analyst and technical evaluator.
Analyze the following real-world software tool:
- Name: "${software.name}" (slug: "${software.slug}")
- Category: "${categoryName}"
- Official Website: "${software.website_url || 'N/A'}"
- Existing Summary: "${software.short_description || software.tagline || 'N/A'}"

Provide a rigorously accurate, factual 2026 technical and commercial breakdown.

CRITICAL FACTUAL RULES:
1. STRICTLY ACCURATE: Do NOT invent features or make generic filler claims. Reflect actual 2026 pricing, known limitations, and licensing reality.
2. NO GENERIC BOILERPLATE: Avoid "X is a powerful tool for teams". Be razor sharp.
3. REAL DEALBREAKERS: State actual reasons why a potential user or team should NOT choose this tool (e.g., missing API, lack of self-hosting, per-seat pricing jumps, steep learning curve).
4. REAL HIDDEN COSTS: Mention real add-on fees, seat minimums, enterprise gates, or storage limits.
5. PRECISE PERSONAS: Exactly who gets maximum ROI from this tool vs. who should avoid it.

Output ONLY valid JSON matching this schema:
{
  "tldr": "1 sharp factual sentence capturing what it does best and its exact market niche.",
  "pros": [
    "Specific technical or functional strength 1",
    "Specific technical or functional strength 2",
    "Specific technical or functional strength 3"
  ],
  "cons": [
    "Authentic limitation, friction point, or drawback 1",
    "Authentic limitation, friction point, or drawback 2"
  ],
  "pricing_model_type": "Free" | "Freemium" | "Paid Only" | "Open Source",
  "target_audience_size": "Solo & Freelancers" | "Startups & Small Teams" | "Mid-Market" | "Enterprise" | "Developers & DevOps",
  "dealbreakers": [
    "Specific scenario/requirement where buyer MUST NOT purchase this tool (e.g. requires cloud only, no HIPAA, closed source)"
  ],
  "hidden_costs": [
    "Specific billing nuances, add-on costs, or limit thresholds (e.g. $10/mo per extra user, API call tiers)"
  ],
  "migration_difficulty": "easy" | "medium" | "hard" | "expert",
  "best_for": [
    "Concrete target persona 1",
    "Concrete target persona 2"
  ],
  "not_for": [
    "Concrete anti-target persona 1",
    "Concrete anti-target persona 2"
  ],
  "switching_reasons": [
    "Real-world trigger 1 why users migrate to alternatives",
    "Real-world trigger 2 why users migrate to alternatives"
  ],
  "key_limitations": [
    "1-2 concrete functional or platform boundaries"
  ],
  "ratings": {
    "ease_of_use": 4.5,
    "price_value": 4.2,
    "features": 4.8,
    "support": 4.0
  },
  "pricing_summary": "Brief 1-line real pricing overview (e.g., 'Free plan available; paid tiers start at $10/user/mo billed annually')",
  "confidence": 0.98
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert SaaS evaluator and tech lead. You output ONLY valid raw JSON with zero markdown codeblocks and zero preamble."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1200
    });

    let raw = response.choices[0]?.message?.content?.trim() || "{}";
    if (raw.startsWith("```json")) raw = raw.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (raw.startsWith("```")) raw = raw.replace(/^```/, "").replace(/```$/, "").trim();

    const parsed = JSON.parse(raw);
    const validated = deepAiFeaturesSchema.parse(parsed);
    return validated;
  } catch (err) {
    console.error(`[Enrich Error] Failed for ${software.slug}:`, err);
    return null;
  }
}

async function main() {
  console.log("=== AppAlter Real Data SaaS Catalog Enrichment ===");

  // Fetch all published softwares
  const { data: softwares, error } = await supabase
    .from("softwares")
    .select("id, slug, name, tagline, short_description, website_url, pricing_notes, category_id, categories(slug, name), ai_features")
    .eq("status", "published")
    .order("view_count", { ascending: false });

  if (error || !softwares) {
    console.error("Failed to query softwares from Supabase:", error);
    process.exit(1);
  }

  console.log(`Found ${softwares.length} published softwares to enrich.`);

  const batchSize = 5;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < softwares.length; i += batchSize) {
    const batch = softwares.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(softwares.length / batchSize)} (${batch.map(s => s.slug).join(", ")})...`);

    await Promise.all(
      batch.map(async (sw) => {
        const enriched = await enrichSoftwareItem(sw);
        if (!enriched) {
          failCount++;
          return;
        }

        // Preserve existing lab benchmarks if they exist
        const existingAi = (sw.ai_features as any) || {};
        const mergedAiFeatures = {
          ...enriched,
          benchmarks: existingAi.benchmarks || undefined
        };

        const updatePayload: any = {
          ai_features: mergedAiFeatures,
          short_description: enriched.tldr,
          pricing_notes: enriched.pricing_summary || sw.pricing_notes,
          ease_of_use_rating: Math.round(enriched.ratings.ease_of_use),
          price_rating: Math.round(enriched.ratings.price_value),
          features_rating: Math.round(enriched.ratings.features),
          support_rating: Math.round(enriched.ratings.support),
          data_quality_score: 95,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from("softwares")
          .update(updatePayload)
          .eq("id", sw.id);

        if (updateError) {
          console.error(`[DB Error] Update failed for ${sw.slug}:`, updateError);
          failCount++;
        } else {
          console.log(`✓ Enriched ${sw.slug} (${enriched.pricing_model_type}, ${enriched.target_audience_size})`);
          successCount++;
        }
      })
    );

    // Short delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n=== Enrichment Completed ===`);
  console.log(`Success: ${successCount} | Failed: ${failCount} | Total: ${softwares.length}`);
}

main().catch(console.error);
