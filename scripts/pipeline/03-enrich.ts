import * as fs from "fs";
import * as path from "path";
import { openai, CATEGORIES, aiFeaturesSchema, parseJsonSafely } from "./config";

async function enrichSoftware(software: any) {
  const prompt = `
    Analyze the software: ${software.name} (${software.slug}).
    This is a software in the B2B SaaS space.

    I need you to generate highly specific, UX-optimized metadata for it.
    
    Provide the data in a JSON object exactly matching this schema:
    {
      "tldr": "A single sentence punchy sales pitch for why a user should choose this software.",
      "pros": ["3 short bullet points (max 5-7 words each)"],
      "cons": ["3 short bullet points (max 5-7 words each)"],
      "pricing_model_type": "One of: Freemium, Open Source, Paid Only, Free",
      "target_audience_size": "One of: Solo, Startup, Enterprise, Any",
      "dealbreakers": ["1 or 2 specific reasons someone should NOT use this"],
      "hidden_costs": ["1 or 2 common hidden costs"],
      "migration_difficulty": "easy, medium, hard, or expert",
      "best_for": ["2 specific use cases"],
      "not_for": ["2 specific anti-use cases"],
      "switching_reasons": ["2 reasons people switch away from this"],
      "key_limitations": ["2 technical or feature limitations"],
      "confidence": 0.95 // A score between 0.0 and 1.0 indicating how confident you are in this data
    }
    
    Output purely valid JSON. No markdown tags. No explanations.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a specialized data extractor. Output strictly valid JSON without any markdown tags." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices[0].message.content;
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

  const enrichedData = [];
  
  for (const item of normalizedData) {
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
    }
    
    // Add a 3 second delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const outputPath = path.join(__dirname, "../../data/raw", `${category}-enriched.json`);
  fs.writeFileSync(outputPath, JSON.stringify(enrichedData, null, 2));
  
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
