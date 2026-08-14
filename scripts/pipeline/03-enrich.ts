import * as fs from "fs";
import * as path from "path";
import { openai, CATEGORIES, aiFeaturesSchema, parseJsonSafely } from "./config";

async function enrichSoftware(software: any) {
  const prompt = `
    Analyze software: ${software.name} (${software.slug}). Category SaaS.
    Provide concise, highly accurate, 2026-current metadata.

    CRITICAL RULES:
    1. NEVER translate or alter proper product/brand/feature names (e.g. Cursor, Notion, Jira, Figma, Slack, Zapier must remain exactly as named).
    2. Be ultra-concise to save tokens (bullets max 4-6 words).
    3. Ensure facts and pricing reflect modern 2026 SaaS reality.

    JSON Schema:
    {
      "tldr": "1 punchy sentence why choose this.",
      "pros": ["3 short pros, max 6 words each"],
      "cons": ["3 short cons, max 6 words each"],
      "pricing_model_type": "Freemium" | "Open Source" | "Paid Only" | "Free",
      "target_audience_size": "Solo" | "Startup" | "Enterprise" | "Any",
      "dealbreakers": ["1-2 concise dealbreakers"],
      "hidden_costs": ["1-2 concise pricing notes"],
      "migration_difficulty": "easy" | "medium" | "hard" | "expert",
      "best_for": ["2 concise use cases"],
      "not_for": ["2 concise anti-use cases"],
      "switching_reasons": ["2 concise switching reasons"],
      "key_limitations": ["2 concise limitations"],
      "confidence": 0.95
    }
    Pure valid JSON only. No markdown fences.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise SaaS data extractor. Output strictly valid JSON. Never translate brand names." },
        { role: "user", content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    const parsedData = parseJsonSafely(content || "{}");
    
    // Validate with Zod
    return aiFeaturesSchema.parse(parsedData);
  } catch (error) {
    console.error(`Failed to enrich software ${software.slug}:`, error);
    return null;
  }
}

async function runEnrich(category: string) {
  const inputPath = path.join(__dirname, "../../data/raw", `${category}-normalized.json`);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    return;
  }

  const normalizedData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`Enriching ${normalizedData.length} items for category: ${category}`);

  const outputPath = path.join(__dirname, "../../data/raw", `${category}-enriched.json`);
  
  let enrichedData: any[] = [];
  if (fs.existsSync(outputPath)) {
    try {
      enrichedData = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      console.log(`Resuming from checkpoint: Found ${enrichedData.length} already enriched items.`);
    } catch (e) {
      console.warn("Could not read existing enriched data, starting fresh.");
    }
  }

  const processedSlugs = new Set(enrichedData.map(item => item.slug));
  
  for (const item of normalizedData) {
    if (processedSlugs.has(item.slug)) {
      console.log(`Skipping ${item.slug}, already enriched.`);
      continue;
    }

    console.log(`Enriching ${item.slug}...`);
    
    let ai_features = null;
    let retries = 3;
    
    while (retries > 0) {
      ai_features = await enrichSoftware(item);
      if (ai_features) break;
      
      console.log(`Retrying ${item.slug} in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries--;
    }
    
    if (ai_features) {
      enrichedData.push({
        ...item,
        ai_features
      });
      
      // Save checkpoint after every successful enrichment
      fs.writeFileSync(outputPath, JSON.stringify(enrichedData, null, 2));
    }
    
    // Add a 3 second delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log(`Successfully enriched ${enrichedData.length} items and saved to ${outputPath}`);
}

async function main() {
  const categoryArg = process.argv[2];
  if (categoryArg && CATEGORIES.includes(categoryArg)) {
    await runEnrich(categoryArg);
  } else {
    console.log(`Please provide a valid category. Options: ${CATEGORIES.join(", ")}`);
  }
}

main();
