import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Fetching all published softwares...");
  const { data: softwares, error } = await supabase
    .from("softwares")
    .select("id, name, slug, category_id")
    .eq("status", "published");

  if (error || !softwares) {
    console.error("Failed to fetch softwares:", error);
    process.exit(1);
  }

  console.log(`Found ${softwares.length} products. Grouping by category...`);

  // Group by category_id
  const byCategory = {};
  for (const sw of softwares) {
    if (!byCategory[sw.category_id]) {
      byCategory[sw.category_id] = [];
    }
    byCategory[sw.category_id].push(sw);
  }

  const alternativeRows = [];

  // For each category, link each product to up to 8 random other products in the same category
  for (const [categoryId, categorySoftwares] of Object.entries(byCategory)) {
    if (categorySoftwares.length < 2) continue; // Need at least 2 to form an alternative

    for (const sw of categorySoftwares) {
      // Find others in the same category
      const others = categorySoftwares.filter((s) => s.id !== sw.id);
      
      // Shuffle array to pick random alternatives
      const shuffled = others.sort(() => 0.5 - Math.random());
      
      // Pick up to 8 alternatives
      const selected = shuffled.slice(0, 8);

      let sortOrder = 1;
      for (const alt of selected) {
        alternativeRows.push({
          software_id: sw.id,
          alternative_id: alt.id,
          sort_order: sortOrder++,
        });
      }
    }
  }

  console.log(`Prepared ${alternativeRows.length} alternative links. Inserting...`);

  // Insert in chunks of 500 to avoid request limits
  const chunkSize = 500;
  for (let i = 0; i < alternativeRows.length; i += chunkSize) {
    const chunk = alternativeRows.slice(i, i + chunkSize);
    const { error: insertError } = await supabase
      .from("alternatives")
      .upsert(chunk, { onConflict: "software_id, alternative_id" });

    if (insertError) {
      console.error("Error inserting alternatives chunk:", insertError);
    } else {
      console.log(`Inserted chunk ${i / chunkSize + 1} / ${Math.ceil(alternativeRows.length / chunkSize)}`);
    }
  }

  // Now update the alternative_count column in softwares table
  console.log("Updating alternative_count in softwares table...");
  const { error: rpcError } = await supabase.rpc("update_all_software_alternative_counts");
  if (rpcError) {
    console.warn("Failed to call RPC to update counts (it might not exist):", rpcError);
    // Fallback: manually update counts
    for (const sw of softwares) {
      const count = alternativeRows.filter(r => r.software_id === sw.id).length;
      if (count > 0) {
        await supabase.from("softwares").update({ alternative_count: count }).eq("id", sw.id);
      }
    }
    console.log("Manually updated alternative counts.");
  } else {
    console.log("Alternative counts updated via RPC.");
  }

  console.log("Phase 4: Alternatives linking completed successfully!");
}

main();
