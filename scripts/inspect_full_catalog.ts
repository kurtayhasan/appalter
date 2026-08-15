import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, software_count, is_active")
    .order("software_count", { ascending: false });

  console.log("Categories breakdown:");
  for (const c of categories || []) {
    console.log(`- [${c.slug}] ${c.name}: count=${c.software_count}, active=${c.is_active}`);
  }

  const { data: softwares, count } = await supabase
    .from("softwares")
    .select("id, slug, name, category_id, categories(slug, name), ai_features", { count: "exact" });

  console.log(`\nTotal Software in DB: ${count}`);
  
  // Group softwares by category
  const grouped: Record<string, string[]> = {};
  for (const sw of softwares || []) {
    const catSlug = (sw.categories as any)?.slug || "uncategorized";
    if (!grouped[catSlug]) grouped[catSlug] = [];
    grouped[catSlug].push(sw.slug);
  }

  console.log("\nSoftwares by Category:");
  for (const [cat, items] of Object.entries(grouped)) {
    console.log(`\n### ${cat} (${items.length} items):`);
    console.log(items.slice(0, 15).join(", ") + (items.length > 15 ? ` ... (+${items.length - 15} more)` : ""));
  }
}

main().catch(console.error);
