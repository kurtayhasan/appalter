import { openai, supabase } from "./pipeline/config";

function extractDomain(url: string): string | null {
  if (!url) return null;
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const parsedUrl = new URL(cleanUrl);
    let domain = parsedUrl.hostname;
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    return domain;
  } catch (e) {
    return null;
  }
}

async function getOfficialUrl(softwareName: string): Promise<string | null> {
  const prompt = `
    You are an expert at finding software website URLs.
    What is the official homepage URL for the software/tool named "${softwareName}"?
    Respond with ONLY the exact valid URL (e.g., https://slack.com or https://www.google.com), and absolutely no other text, explanation, or markdown.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You respond ONLY with a raw URL. No quotes, no markdown, no sentences." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    if (content.startsWith("http")) {
      return content;
    }
    if (content.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      return `https://${content}`;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get URL for ${softwareName}:`, error);
    return null;
  }
}

async function runHealUrls() {
  console.log("Fetching softwares missing website URLs...");
  
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
  
  const missingUrls = allSoftwares.filter(sw => !sw.website_url || sw.website_url.trim() === "");
  console.log(`Found ${missingUrls.length} softwares missing website_url.`);
  
  if (missingUrls.length === 0) {
    console.log("All softwares have website_urls. Exiting.");
    return;
  }
  
  let successCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < missingUrls.length; i++) {
    const sw = missingUrls[i];
    console.log(`[${i+1}/${missingUrls.length}] Finding URL for ${sw.name}...`);
    
    const url = await getOfficialUrl(sw.name);
    
    if (url) {
      const domain = extractDomain(url);
      if (domain) {
        const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        
        const { error } = await supabase
          .from("softwares")
          .update({ 
            website_url: url,
            logo_url: logoUrl
          })
          .eq("id", sw.id);
          
        if (error) {
          console.error(`❌ Failed to update DB for ${sw.slug}`, error);
          failedCount++;
        } else {
          console.log(`✅ Success: ${sw.name} -> ${url}`);
          successCount++;
        }
      } else {
        console.log(`⚠️ Invalid domain extracted for ${sw.name}: ${url}`);
        failedCount++;
      }
    } else {
      console.log(`❌ OpenAI couldn't find URL for ${sw.name}`);
      failedCount++;
    }
    
    // Prevent rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\nURL & Logo Healing Complete!`);
  console.log(`Successfully fixed: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
}

runHealUrls();
