import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testScreenshots() {
  const { data: sw } = await supabase
    .from("softwares")
    .select("id, slug, name")
    .eq("slug", "notion")
    .single();

  if (!sw) {
    console.log("Notion not found");
    return;
  }

  const { data: screenshots, error } = await supabase
    .from("software_screenshots")
    .select("*")
    .eq("software_id", sw.id);

  console.log("Notion software ID:", sw.id);
  console.log("Screenshots in DB:", screenshots);
  console.log("Error:", error);
}

testScreenshots().catch(console.error);
