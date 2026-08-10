import * as fs from "fs";
import * as path from "path";
import { supabase } from "./pipeline/config";

async function runAudit() {
  console.log("Fetching all published softwares from database...");
  
  // We need to fetch all softwares. Since it might be > 1000, we should paginate.
  let allSoftwares: any[] = [];
  let page = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from("softwares")
      .select("*")
      .eq("status", "published")
      .range(page * limit, (page + 1) * limit - 1);
      
    if (error) {
      console.error("Error fetching softwares:", error);
      process.exit(1);
    }
    
    if (data.length === 0) break;
    
    allSoftwares = [...allSoftwares, ...data];
    page++;
  }
  
  console.log(`Found ${allSoftwares.length} published softwares.`);
  
  const report = {
    total: allSoftwares.length,
    missingAiFeatures: 0,
    missingLogo: 0,
    shortDescription: 0,
    noAlternatives: 0,
    healthy: 0,
    quarantineList: [] as string[]
  };
  
  for (const sw of allSoftwares) {
    let isHealthy = true;
    let issues = [];
    
    // Check AI Features
    const ai = sw.ai_features;
    if (!ai || Object.keys(ai).length === 0 || !ai.pros || !ai.cons) {
      report.missingAiFeatures++;
      issues.push("missing_ai_features");
      isHealthy = false;
    }
    
    // Check Logo
    if (!sw.logo_url || sw.logo_url.trim() === "") {
      report.missingLogo++;
      issues.push("missing_logo");
      isHealthy = false;
    }
    
    // Check Description
    if (!sw.description || sw.description.length < 50) {
      report.shortDescription++;
      issues.push("short_description");
      isHealthy = false;
    }
    
    // Check Alternatives (This is cached in the software record as alternative_count)
    if (sw.alternative_count === 0) {
      report.noAlternatives++;
      issues.push("no_alternatives");
      isHealthy = false;
    }
    
    if (isHealthy) {
      report.healthy++;
    } else {
      report.quarantineList.push(`${sw.slug} (${issues.join(", ")})`);
    }
  }
  
  console.log("\n==============================");
  console.log("   DATABASE AUDIT REPORT");
  console.log("==============================\n");
  console.log(`Total Published Softwares: ${report.total}`);
  console.log(`Fully Healthy: ${report.healthy} (${((report.healthy / report.total) * 100).toFixed(1)}%)`);
  console.log(`\nISSUES FOUND:`);
  console.log(`- Missing AI Features (Pros/Cons/etc): ${report.missingAiFeatures}`);
  console.log(`- Missing Logo: ${report.missingLogo}`);
  console.log(`- Very Short Description (<50 chars): ${report.shortDescription}`);
  console.log(`- 0 Alternatives Listed: ${report.noAlternatives}`);
  
  const outputPath = path.join(__dirname, "../../data/audit_report.json");
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to ${outputPath}`);
}

runAudit();
