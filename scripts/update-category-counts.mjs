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
  console.log("Fetching categories...");
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name");

  if (catError || !categories) {
    console.error("Failed to fetch categories:", catError);
    process.exit(1);
  }

  for (const category of categories) {
    const { count, error: countError } = await supabase
      .from("softwares")
      .select("id", { count: "exact", head: true })
      .eq("category_id", category.id)
      .eq("status", "published");

    if (countError) {
      console.error(`Failed to count for category ${category.name}:`, countError);
      continue;
    }

    const { error: updateError } = await supabase
      .from("categories")
      .update({ software_count: count })
      .eq("id", category.id);

    if (updateError) {
      console.error(`Failed to update category ${category.name}:`, updateError);
    } else {
      console.log(`Updated ${category.name}: ${count} products`);
    }
  }

  console.log("Category counts updated successfully!");
}

main();
