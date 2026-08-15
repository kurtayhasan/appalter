import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("Fast bulk peer linking and count synchronization...");

  // 1. Fetch softwares
  const { data: softwares } = await supabase
    .from("softwares")
    .select("id, slug, name, category_id");

  if (!softwares) return;

  // Group by category
  const catGroups: Record<string, typeof softwares> = {};
  for (const sw of softwares) {
    const catId = sw.category_id || "none";
    if (!catGroups[catId]) catGroups[catId] = [];
    catGroups[catId].push(sw);
  }

  // 2. Prepare bulk alternative links
  const altRows: Array<{ software_id: string; alternative_id: string; similarity_score: number; is_approved: boolean }> = [];

  for (const [catId, group] of Object.entries(catGroups)) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      const swA = group[i];
      if (!swA) continue;
      const peers = group.filter((_, idx) => idx !== i).slice(0, 8);
      for (const swB of peers) {
        if (!swB) continue;
        altRows.push({
          software_id: swA.id,
          alternative_id: swB.id,
          similarity_score: 0.9,
          is_approved: true,
        });
      }
    }
  }

  // Chunked batch upsert (500 per chunk)
  console.log(`Upserting ${altRows.length} peer alternative rows...`);
  for (let i = 0; i < altRows.length; i += 500) {
    const chunk = altRows.slice(i, i + 500);
    await supabase.from("alternatives").upsert(chunk, { onConflict: "software_id,alternative_id" });
  }

  // 3. Update alternative_count per software with 8
  console.log("Setting accurate alternative counts...");
  for (const sw of softwares) {
    const count = (catGroups[sw.category_id || "none"]?.length || 1) - 1;
    const finalCount = Math.min(Math.max(count, 0), 8);
    await supabase.from("softwares").update({ alternative_count: finalCount }).eq("id", sw.id);
  }

  console.log("Bulk sync completed successfully!");
}

main().catch(console.error);
