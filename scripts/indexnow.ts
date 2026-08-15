import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const host = "appalter.com";
const key = "appalter2026indexnowkey889";
const keyLocation = `https://${host}/${key}.txt`;
const locales = ["en", "tr", "de", "es"];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getUrl(loc: string, path: string = "") {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return loc === "en"
    ? `https://${host}${cleanPath}`
    : `https://${host}/${loc}${cleanPath}`;
}

async function submitIndexNow() {
  console.log("🚀 Starting IndexNow submission for Bing, Yandex, Seznam & Naver...");

  const urlList: string[] = [];

  // 1. Static Home & Categories
  for (const loc of locales) {
    urlList.push(getUrl(loc, ""));
    urlList.push(getUrl(loc, "/categories"));
  }

  // 2. Active Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true);

  for (const cat of categories || []) {
    for (const loc of locales) {
      urlList.push(getUrl(loc, `/category/${cat.slug}`));
    }
  }

  // 3. Published Softwares
  const { data: softwares } = await supabase
    .from("softwares")
    .select("slug")
    .eq("status", "published");

  for (const sw of softwares || []) {
    for (const loc of locales) {
      urlList.push(getUrl(loc, `/${sw.slug}`));
      urlList.push(getUrl(loc, `/${sw.slug}/alternatives`));
    }
  }

  // 4. VS Comparisons
  const { data: alternatives } = await supabase
    .from("alternatives")
    .select(`
      software:softwares!alternatives_software_id_fkey(slug),
      alternative:softwares!alternatives_alternative_id_fkey(slug)
    `)
    .eq("is_approved", true)
    .limit(1000);

  for (const alt of (alternatives as any[]) || []) {
    if (alt.software?.slug && alt.alternative?.slug) {
      for (const loc of locales) {
        urlList.push(getUrl(loc, `/${alt.software.slug}/vs/${alt.alternative.slug}`));
      }
    }
  }

  console.log(`📊 Generated ${urlList.length} unique URLs to submit via IndexNow.`);

  // IndexNow allows up to 10,000 URLs per request
  const payload = {
    host,
    key,
    keyLocation,
    urlList: urlList.slice(0, 10000),
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Pushing URLs to ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (res.status === 200 || res.status === 202) {
        console.log(`✅ SUCCESS (${res.status}): URLs successfully received by ${endpoint}!`);
      } else {
        const text = await res.text();
        console.log(`⚠️ Response (${res.status}) from ${endpoint}: ${text}`);
      }
    } catch (err) {
      console.error(`❌ Error submitting to ${endpoint}:`, err);
    }
  }

  console.log("\n🎉 IndexNow instant crawl trigger completed!");
}

submitIndexNow().catch(console.error);
