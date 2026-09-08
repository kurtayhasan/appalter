import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: softwares } = await supabase
    .from("softwares")
    .select("name, slug, view_count, alternative_count")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(15);

  console.log("TOP SOFTWARES:");
  softwares?.forEach((s) => console.log(`- https://www.appalter.com/${s.slug} (${s.name})`));

  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug, software_count")
    .eq("is_active", true)
    .order("software_count", { ascending: false })
    .limit(8);

  console.log("\nTOP CATEGORIES:");
  categories?.forEach((c) => console.log(`- https://www.appalter.com/category/${c.slug} (${c.name})`));

  const { data: alts } = await supabase
    .from("alternatives")
    .select(`
      software:softwares!alternatives_software_id_fkey(slug, name),
      alternative:softwares!alternatives_alternative_id_fkey(slug, name)
    `)
    .eq("is_approved", true)
    .limit(10);

  console.log("\nTOP COMPARISONS:");
  (alts as any[])?.forEach((a) => {
    if (a.software?.slug && a.alternative?.slug) {
      console.log(`- https://www.appalter.com/${a.software.slug}/vs/${a.alternative.slug}`);
    }
  });
}

run();
