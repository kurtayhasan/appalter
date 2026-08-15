import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  console.log("1. Checking Open Source Softwares & GitHub URLs in Supabase...");
  
  const { data: ossSoftwares } = await supabase
    .from("softwares")
    .select("id, slug, name, github_url, starting_price, alternative_count, pricing_models(slug, name), categories(slug, name), ai_features")
    .or("pricing_model_id.eq.65a953e5-8271-460d-8531-10c0aa482937,github_url.not.is.null")
    .order("name", { ascending: true });

  console.log(`Found ${ossSoftwares?.length || 0} Open Source software entries:`);
  for (const s of ossSoftwares || []) {
    console.log(`- ${s.name} (${s.slug}):`);
    console.log(`  Category: ${(s.categories as any)?.name || "N/A"} | GitHub: ${s.github_url || "N/A"}`);
    console.log(`  Stars: ${s.ai_features?.benchmarks?.metrics?.github_stars || "N/A"} | Alternatives: ${s.alternative_count}`);
  }

  console.log("\n2. Synchronizing exact alternative_count with actual rows in alternatives table...");
  const { data: allSoftwares } = await supabase.from("softwares").select("id, slug, name");

  let fixedCount = 0;
  for (const sw of allSoftwares || []) {
    const { count } = await supabase
      .from("alternatives")
      .select("*", { count: "exact", head: true })
      .eq("software_id", sw.id);

    const actualCount = count || 0;
    
    // Update software record with exact actual count
    await supabase
      .from("softwares")
      .update({ alternative_count: actualCount })
      .eq("id", sw.id);

    fixedCount++;
  }

  console.log(`Successfully synchronized exact alternative counts for all ${fixedCount} software products!`);
}

run().catch(console.error);
