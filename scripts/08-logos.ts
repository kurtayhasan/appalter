import { supabase } from "./pipeline/config";

function extractDomain(url: string): string | null {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    let domain = parsedUrl.hostname;
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    return domain;
  } catch (e) {
    return null;
  }
}

async function runLogos() {
  console.log("Fetching all softwares without logos...");
  
  let allSoftwares: any[] = [];
  let page = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from("softwares")
      .select("id, name, slug, website_url, logo_url")
      .range(page * limit, (page + 1) * limit - 1);
      
    if (error) {
      console.error("Error fetching softwares:", error);
      process.exit(1);
    }
    
    if (data.length === 0) break;
    
    allSoftwares = [...allSoftwares, ...data];
    page++;
  }
  
  const missingLogos = allSoftwares.filter(sw => !sw.logo_url || sw.logo_url.trim() === "");
  console.log(`Found ${missingLogos.length} softwares missing logos.`);
  
  if (missingLogos.length === 0) {
    console.log("All softwares have logos. Exiting.");
    return;
  }
  
  let successCount = 0;
  let skippedCount = 0;
  
  for (const sw of missingLogos) {
    const domain = extractDomain(sw.website_url);
    if (!domain) {
      // If there's no website URL, it will keep using the UI-Avatars fallback which is perfectly fine.
      console.log(`[Skip] ${sw.slug}: No valid website_url found. (Will use UI-Avatars fallback)`);
      skippedCount++;
      continue;
    }
    
    // We use Google's Favicon service. It's extremely reliable and doesn't block requests.
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    
    const { error } = await supabase
      .from("softwares")
      .update({ logo_url: logoUrl })
      .eq("id", sw.id);
      
    if (error) {
      console.error(`Failed to update DB for ${sw.slug}`, error);
    } else {
      console.log(`✅ [${successCount+skippedCount+1}/${missingLogos.length}] Added logo for ${sw.name}`);
      successCount++;
    }
  }
  
  console.log(`\nLogo Fetching Complete!`);
  console.log(`Successfully added: ${successCount}`);
  console.log(`Skipped (Kept Fallback): ${skippedCount}`);
}

runLogos();
