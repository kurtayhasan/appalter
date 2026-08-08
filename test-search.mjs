import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('search_softwares', { query_text: 'chat' });
  console.log("Error:", error);
  console.log("Data length:", data ? data.length : 0);
  console.log("Data:", data);
}

run();
