import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllCounts() {
  console.log("🔄 Starting count synchronization...");

  // 1. Sync Categories software_count
  const { data: categories, error: catErr } = await supabase.from("categories").select("id, slug, name, software_count");
  if (catErr) {
    console.error("Categories fetch error:", catErr);
    return;
  }

  for (const cat of categories || []) {
    const { count } = await supabase
      .from("softwares")
      .select("*", { count: "exact", head: true })
      .eq("category_id", cat.id)
      .eq("status", "published");

    const realCount = count || 0;
    if (realCount !== cat.software_count) {
      await supabase.from("categories").update({ software_count: realCount }).eq("id", cat.id);
      console.log(`✅ Category [${cat.name}] count synced: ${cat.software_count} -> ${realCount}`);
    } else {
      console.log(`✨ Category [${cat.name}] count is accurate: ${realCount}`);
    }
  }

  // 2. Report total published softwares & relations
  const { count: totalSoftwares } = await supabase.from("softwares").select("*", { count: "exact", head: true }).eq("status", "published");
  const { count: totalAlternatives } = await supabase.from("alternatives").select("*", { count: "exact", head: true });

  console.log(`\n📊 DATABASE REAL-TIME SUMMARY:`);
  console.log(`- Total Published Softwares: ${totalSoftwares}`);
  console.log(`- Total Live Alternatives/Relations: ${totalAlternatives}`);
}

syncAllCounts().catch(console.error);
