import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const slugs = ["notion", "slack", "clickup", "baserow", "bitwarden"];
  const { data: softwares } = await supabase
    .from("softwares")
    .select("slug, name, tagline, short_description, pricing_notes, ai_features, price_rating, ease_of_use_rating, features_rating, support_rating, software_screenshots(url, caption)")
    .in("slug", slugs);

  console.log("=== ENRICHED SAMPLE VERIFICATION ===");
  for (const sw of softwares || []) {
    console.log(`\n========================================`);
    console.log(`TOOL: ${sw.name} (${sw.slug})`);
    console.log(`TL;DR: ${sw.short_description}`);
    console.log(`Pricing Notes: ${sw.pricing_notes}`);
    console.log(`Ratings: Ease=${sw.ease_of_use_rating}/5 | Price=${sw.price_rating}/5 | Features=${sw.features_rating}/5 | Support=${sw.support_rating}/5`);
    console.log(`Dealbreakers:`, (sw.ai_features as any)?.dealbreakers);
    console.log(`Hidden Costs:`, (sw.ai_features as any)?.hidden_costs);
    console.log(`Best For:`, (sw.ai_features as any)?.best_for);
    console.log(`Not For:`, (sw.ai_features as any)?.not_for);
    console.log(`Screenshots Count:`, (sw.software_screenshots as any)?.length || 0);
  }
}

main().catch(console.error);
