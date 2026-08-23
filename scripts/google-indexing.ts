import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const host = "https://appalter.com";
const locales = ["en", "tr", "de", "es"];

function getUrl(loc: string, path: string = "") {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return loc === "en"
    ? `${host}${cleanPath}`
    : `${host}/${loc}${cleanPath}`;
}

const keyFilePath = resolve(process.cwd(), "service-account.json");

if (!fs.existsSync(keyFilePath)) {
  console.error("❌ service-account.json file not found in project root!");
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runGoogleIndexing() {
  console.log("🚀 Initializing Google Indexing API Client...");

  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const authClient = await auth.getClient();
  const indexing = google.indexing({
    version: "v3",
    auth: authClient as any,
  });

  console.log("✅ Authenticated with Google Cloud Indexing API.");

  // 1. Collect highest priority URLs (Limit to daily Google quota ~100-200)
  const priorityUrls: string[] = [];

  // Home & Main Pages
  for (const loc of locales) {
    priorityUrls.push(getUrl(loc, ""));
    priorityUrls.push(getUrl(loc, "/categories"));
  }

  // Active Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true);

  for (const cat of categories || []) {
    for (const loc of ["en", "tr"]) {
      priorityUrls.push(getUrl(loc, `/category/${cat.slug}`));
    }
  }

  // Top 50 Published Softwares
  const { data: softwares } = await supabase
    .from("softwares")
    .select("slug")
    .eq("status", "published")
    .limit(50);

  for (const sw of softwares || []) {
    priorityUrls.push(getUrl("en", `/${sw.slug}`));
    priorityUrls.push(getUrl("en", `/${sw.slug}/alternatives`));
  }

  // Top 40 VS Comparisons
  const { data: alternatives } = await supabase
    .from("alternatives")
    .select(`
      software:softwares!alternatives_software_id_fkey(slug),
      alternative:softwares!alternatives_alternative_id_fkey(slug)
    `)
    .eq("is_approved", true)
    .limit(40);

  for (const alt of (alternatives as any[]) || []) {
    if (alt.software?.slug && alt.alternative?.slug) {
      priorityUrls.push(getUrl("en", `/${alt.software.slug}/vs/${alt.alternative.slug}`));
    }
  }

  console.log(`\n📡 Submitting ${priorityUrls.length} priority URLs to Google Indexing API...`);

  let successCount = 0;
  let failCount = 0;

  for (const url of priorityUrls) {
    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: "URL_UPDATED",
        },
      });

      if (response.status === 200) {
        console.log(`✅ [Googlebot Notified] ${url}`);
        successCount++;
      } else {
        console.log(`⚠️ Status ${response.status} for ${url}`);
      }
    } catch (err: any) {
      console.error(`❌ Error submitting ${url}:`, err.message || err);
      failCount++;
    }

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n🎉 Google Indexing Run Finished!`);
  console.log(`- Successfully Notified: ${successCount} URLs`);
  console.log(`- Failed / Pending Verification: ${failCount} URLs`);
}

runGoogleIndexing().catch(console.error);
