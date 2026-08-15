import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("Analyzing alternatives table for invalid / mismatching cross-category relations...");

  // 1. Fetch all softwares with their categories
  const { data: softwares } = await supabase
    .from("softwares")
    .select("id, slug, name, category_id, categories(slug, name)");

  if (!softwares) return;
  const swMap = new Map(softwares.map(s => [s.id, s]));

  // 2. Fetch all alternative relations
  const { data: alts } = await supabase
    .from("alternatives")
    .select("id, software_id, alternative_id, similarity_score");

  if (!alts) return;

  console.log(`Total alternative relations in DB: ${alts.length}`);

  // Permitted cross-category logical pairs (e.g. communication vs productivity)
  const crossCategoryWhitelist = new Set([
    "slack-microsoft-teams",
    "microsoft-teams-slack",
    "discord-slack",
    "slack-discord",
    "zoom-google-meet",
    "google-meet-zoom",
  ]);

  const invalidIds: string[] = [];
  let mismatchCount = 0;

  for (const rel of alts) {
    const swA = swMap.get(rel.software_id);
    const swB = swMap.get(rel.alternative_id);

    if (!swA || !swB) {
      invalidIds.push(rel.id);
      continue;
    }

    // Check category match
    if (swA.category_id !== swB.category_id) {
      const pairKey = `${swA.slug}-${swB.slug}`;
      if (!crossCategoryWhitelist.has(pairKey)) {
        // e.g. Notion vs Webex or Onedrive vs Trello
        mismatchCount++;
        invalidIds.push(rel.id);
      }
    }
  }

  console.log(`Found ${mismatchCount} mismatched cross-category alternative relations.`);

  if (invalidIds.length > 0) {
    console.log(`Cleaning up ${invalidIds.length} invalid relations...`);
    // Delete in chunks of 500
    for (let i = 0; i < invalidIds.length; i += 500) {
      const chunk = invalidIds.slice(i, i + 500);
      await supabase.from("alternatives").delete().in("id", chunk);
    }
    console.log("Successfully cleaned all invalid cross-category junk relations!");
  }

  // 3. Recalculate exact alternative_count on all softwares
  console.log("Recalculating exact alternative_count...");
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

  console.log("Cleanup and counter synchronization complete!");
}

main().catch(console.error);
