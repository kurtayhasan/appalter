import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getCleanWebsiteUrl(rawUrl: string | null): string | null {
  if (!rawUrl || rawUrl.trim() === "") return null;
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

// Generate high-resolution desktop screenshot URL
function generateScreenshotUrl(websiteUrl: string): string {
  return `https://api.microlink.io/?url=${encodeURIComponent(websiteUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&viewport.deviceScaleFactor=1`;
}

async function main() {
  console.log("=== AppAlter Automated Fast Screenshot Engine ===");

  // 1. Fetch all published softwares
  const { data: softwares, error } = await supabase
    .from("softwares")
    .select("id, slug, name, website_url")
    .eq("status", "published")
    .order("view_count", { ascending: false });

  if (error || !softwares) {
    console.error("Failed to fetch softwares:", error);
    process.exit(1);
  }

  console.log(`Found ${softwares.length} published softwares.`);

  // 2. Fetch existing screenshots to avoid duplicates
  const { data: existingScreenshots } = await supabase
    .from("software_screenshots")
    .select("software_id");

  const existingMap = new Set((existingScreenshots || []).map((s) => s.software_id));
  console.log(`Already have screenshots for ${existingMap.size} softwares.`);

  const needsScreenshots = softwares.filter((s) => !existingMap.has(s.id));
  console.log(`${needsScreenshots.length} softwares need screenshots added.`);

  const inserts: any[] = [];
  for (const sw of needsScreenshots) {
    const cleanUrl = getCleanWebsiteUrl(sw.website_url);
    if (!cleanUrl) continue;

    const screenshotUrl = generateScreenshotUrl(cleanUrl);
    inserts.push({
      software_id: sw.id,
      url: screenshotUrl,
      thumb_url: screenshotUrl,
      alt_text: `${sw.name} desktop interface and feature dashboard`,
      caption: `${sw.name} Official Interface`,
      width: 1280,
      height: 800,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const batchSize = 50;
  let totalInserted = 0;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    const { error: insertErr } = await supabase
      .from("software_screenshots")
      .insert(batch);

    if (insertErr) {
      console.error(`Batch insert error at index ${i}:`, insertErr);
    } else {
      totalInserted += batch.length;
      console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${totalInserted}/${inserts.length} total)`);
    }
  }

  console.log(`\n=== Screenshot Batch Engine Completed ===`);
  console.log(`Successfully added screenshots for ${totalInserted} softwares.`);
}

main().catch(console.error);
