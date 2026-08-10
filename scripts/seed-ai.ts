import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const isDryRun = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// High-priority affiliate categories based on strategy
const TARGET_CATEGORIES = [
  "crm",
  "hr",
  "marketing",
  "finance",
  "email",
  "security",
  "project-management",
  "design",
  "automation",
  "customer-support"
];

const TARGET_COUNT_PER_CAT = 15; // To keep tokens manageable per request

interface GeneratedSoftware {
  name: string;
  slug: string;
  tagline: string;
  short_description: string;
  website_url: string;
  pricing_model_slug: string;
  alternatives: string[]; // slugs of alternatives
}

async function getCategoryAndPricingMaps() {
  console.log("Fetching categories and pricing models...");
  
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, slug, name");
    
  if (catErr) throw catErr;

  const { data: pricingModels, error: priceErr } = await supabase
    .from("pricing_models")
    .select("id, slug");
    
  if (priceErr) throw priceErr;

  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
  const pricingMap = new Map(pricingModels.map(p => [p.slug, p.id]));
  
  // Fallback pricing model if Claude returns something weird
  const defaultPricingId = pricingMap.get("freemium") || pricingModels[0].id;

  return { categoryMap, pricingMap, defaultPricingId };
}

async function generateSoftwaresForCategory(categoryName: string): Promise<GeneratedSoftware[]> {
  console.log(`\n🤖 Asking Claude to generate ~${TARGET_COUNT_PER_CAT} softwares for category: ${categoryName}...`);
  
  const prompt = `You are a data extraction expert building a software directory. 
Generate a list of exactly ${TARGET_COUNT_PER_CAT} popular software products in the "${categoryName}" category.

Return ONLY a raw JSON array of objects. Do not wrap in \`\`\`json or provide any conversational text.

Each object must have the following exact schema:
{
  "name": "Software Name",
  "slug": "software-name-slugified",
  "tagline": "A catchy one-liner (maximum 100 characters)",
  "short_description": "A brief overview of what the software does (max 250 characters)",
  "website_url": "https://www.software.com",
  "pricing_model_slug": "freemium" | "paid" | "free" | "open-source" | "subscription" | "enterprise",
  "alternatives": ["slug-of-competitor-1", "slug-of-competitor-2"] // Array of up to 5 competing tools that are ALSO in this list you are generating
}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0.2,
    system: "You are a backend API that returns strictly valid JSON without any markdown formatting or explanations.",
    messages: [
      { role: "user", content: prompt }
    ]
  });

  const responseText = (message.content[0] as any).text.trim();
  
  try {
    const data = JSON.parse(responseText);
    return data;
  } catch (err) {
    console.error(`Failed to parse JSON for ${categoryName}. Raw response:`);
    console.error(responseText);
    return [];
  }
}

async function main() {
  console.log(`Starting AI Seeder... (Dry Run: ${isDryRun})`);
  
  const { categoryMap, pricingMap, defaultPricingId } = await getCategoryAndPricingMaps();

  let totalInserted = 0;
  let totalAlternatives = 0;

  for (const catSlug of TARGET_CATEGORIES) {
    const catId = categoryMap.get(catSlug);
    if (!catId) {
      console.warn(`⚠️ Category '${catSlug}' not found in DB. Skipping.`);
      continue;
    }

    const softwares = await generateSoftwaresForCategory(catSlug);
    
    if (softwares.length === 0) continue;
    
    console.log(`✅ Generated ${softwares.length} items for ${catSlug}.`);
    
    if (isDryRun) {
      console.log(`[DRY RUN] Would insert ${softwares.length} records into softwares table.`);
      console.log(JSON.stringify(softwares.slice(0, 2), null, 2), "...(truncated)");
      continue;
    }

    // 1. Insert Softwares
    const softwareInserts = softwares.map(s => {
      let pricingId = pricingMap.get(s.pricing_model_slug);
      if (!pricingId) pricingId = defaultPricingId;

      return {
        name: s.name,
        slug: s.slug,
        tagline: s.tagline.substring(0, 150),
        short_description: s.short_description.substring(0, 290),
        website_url: s.website_url,
        category_id: catId,
        pricing_model_id: pricingId,
        status: 'published', // Critical fix here based on schema
        is_featured: false
      };
    });

    const { data: insertedSoftwares, error: insertErr } = await supabase
      .from("softwares")
      .upsert(softwareInserts, { onConflict: "slug", ignoreDuplicates: true })
      .select("id, slug");

    if (insertErr) {
      console.error(`Error inserting softwares for ${catSlug}:`, insertErr.message);
      continue;
    }

    console.log(`💾 Inserted ${insertedSoftwares?.length || 0} softwares.`);
    totalInserted += insertedSoftwares?.length || 0;

    // We need a complete map of slug -> id for this category to insert alternatives
    const { data: allSoftwares } = await supabase
      .from("softwares")
      .select("id, slug")
      .eq("category_id", catId);

    const slugToId = new Map((allSoftwares || []).map(s => [s.slug, s.id]));

    // 2. Insert Alternatives
    const altInserts: any[] = [];
    for (const s of softwares) {
      const sourceId = slugToId.get(s.slug);
      if (!sourceId) continue;

      for (const altSlug of s.alternatives) {
        const altId = slugToId.get(altSlug);
        if (altId && altId !== sourceId) {
          // Generate a random similarity score between 0.70 and 0.95
          const simScore = (Math.random() * (0.95 - 0.70) + 0.70).toFixed(2);
          
          altInserts.push({
            software_id: sourceId,
            alternative_id: altId,
            similarity_score: simScore,
            is_approved: true
          });
        }
      }
    }

    if (altInserts.length > 0) {
      const { error: altErr } = await supabase
        .from("alternatives")
        .upsert(altInserts, { onConflict: "software_id,alternative_id", ignoreDuplicates: true });

      if (altErr) {
        console.error(`Error inserting alternatives for ${catSlug}:`, altErr.message);
      } else {
        console.log(`🔗 Inserted ${altInserts.length} alternative relationships.`);
        totalAlternatives += altInserts.length;
      }
    }
    
    // Add a small delay between requests to avoid rate limits
    await new Promise(res => setTimeout(res, 2000));
  }

  console.log("\n🎉 AI Seeding Complete!");
  console.log(`📊 Total Softwares Inserted: ${totalInserted}`);
  console.log(`📊 Total Alternatives Created: ${totalAlternatives}`);
}

main().catch(console.error);
