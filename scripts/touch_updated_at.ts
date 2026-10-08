import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function touchAll() {
  console.log("Touching all softwares to update updated_at...");
  
  const { data: softwares } = await supabase.from("softwares").select("id");
  if (softwares) {
    for (let i = 0; i < softwares.length; i += 100) {
      const batch = softwares.slice(i, i + 100).map(s => s.id);
      await supabase.from("softwares").update({ updated_at: new Date().toISOString() }).in("id", batch);
    }
    console.log("Success touching softwares!");
  }

  console.log("Touching all alternatives to update updated_at...");
  const { data: alts } = await supabase.from("alternatives").select("software_id, alternative_id");
  if (alts) {
    for (let i = 0; i < alts.length; i += 10) {
      const batch = alts.slice(i, i + 10);
      await Promise.all(batch.map(b => 
         supabase.from("alternatives")
          .update({ updated_at: new Date().toISOString() })
          .eq("software_id", b.software_id)
          .eq("alternative_id", b.alternative_id)
      ));
    }
    console.log("Success touching alternatives!");
  }
}

touchAll().catch(console.error);
