import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("Starting comprehensive alternative peer graph generator for all 300 software entries...");

  // 1. Fetch all softwares
  const { data: softwares } = await supabase
    .from("softwares")
    .select("id, slug, name, category_id, categories(slug, name)");

  if (!softwares) return;

  // Group by category
  const catGroups: Record<string, typeof softwares> = {};
  for (const sw of softwares) {
    const catId = sw.category_id || "general";
    if (!catGroups[catId]) catGroups[catId] = [];
    catGroups[catId].push(sw);
  }

  // Generate reciprocal peer links within categories
  for (const [catId, group] of Object.entries(catGroups)) {
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      const swA = group[i];
      if (!swA) continue;

      // Connect to other software in same category (up to 8 peers)
      const peers = group.filter((_, idx) => idx !== i).slice(0, 8);

      for (const swB of peers) {
        if (!swB) continue;
        await supabase.from("alternatives").upsert(
          {
            software_id: swA.id,
            alternative_id: swB.id,
            similarity_score: 0.9,
            is_approved: true,
          },
          { onConflict: "software_id,alternative_id" }
        );
      }
    }
  }

  // Synchronize exact count
  console.log("Updating exact alternative_count on all softwares...");
  for (const sw of softwares) {
    const { count } = await supabase
      .from("alternatives")
      .select("*", { count: "exact", head: true })
      .eq("software_id", sw.id);

    await supabase
      .from("softwares")
      .update({ alternative_count: count || 0 })
      .eq("id", sw.id);
  }

  // Update categories count
  const { data: categories } = await supabase.from("categories").select("id, slug");
  for (const cat of categories || []) {
    const { count } = await supabase
      .from("softwares")
      .select("*", { count: "exact", head: true })
      .eq("category_id", cat.id);

    await supabase
      .from("categories")
      .update({
        software_count: count || 0,
        is_active: (count || 0) > 0,
      })
      .eq("id", cat.id);
  }

  console.log("Comprehensively synchronized all alternative relationships and category counters!");
}

main().catch(console.error);
