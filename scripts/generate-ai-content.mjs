import fs from 'fs';
import path from 'path';

// Usage: node scripts/generate-ai-content.mjs

const SYSTEM_PROMPT = `You are an expert SEO content writer and data researcher for a software directory platform (like G2 or Capterra). 
Your task is to generate highly unique, structured data for the given software product. 
DO NOT use generic marketing fluff. Use deep technical insights, LSI keywords, and objective tone.
You MUST output valid JSON only.

The JSON schema must be exactly this (all fields required):
{
  "slug": "string (kebab-case name of the software)",
  "name": "string",
  "tagline": "string (catchy, max 60 chars)",
  "short_description": "string (1-2 sentences)",
  "description": "string (in-depth review, 2-3 paragraphs with technical SEO focus)",
  "starting_price": number (or null if unknown/free),
  "price_currency": "USD",
  "is_featured": boolean (randomly true for 10% of items),
  "is_sponsored": false,
  "category_name": "string (the category name I provide)",
  "category_slug": "string (the category slug I provide)"
}`;

async function generateSoftwareContent(softwareName, categorySlug, apiKey) {
  console.log(`Generating content for: ${softwareName}...`);
  
  const prompt = `Generate the JSON data for the software product: "${softwareName}". Category: "${categorySlug}".`;

  try {
    // Using gemini-1.5-flash which is extremely fast and has a great free tier
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: SYSTEM_PROMPT }
        },
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    return JSON.parse(content);
  } catch (err) {
    console.error(`Failed to generate content for ${softwareName}:`, err.message);
    return null;
  }
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
    console.log("Please run: set GEMINI_API_KEY=your_key && node scripts/generate-ai-content.mjs");
    process.exit(1);
  }

  const seedPath = path.resolve(process.cwd(), 'scripts/seed-data.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  const generatedItems = [];
  
  // To avoid hitting rate limits, process in small batches or sequentially.
  // For demonstration, we'll process the first 5. (Change to seedData.length for all)
  const LIMIT = 5; 
  console.log(`Found ${seedData.length} items. Processing first ${LIMIT} for testing...`);

  for (let i = 0; i < LIMIT; i++) {
    const item = seedData[i];
    const generated = await generateSoftwareContent(item.name, item.category_slug, apiKey);
    
    if (generated) {
      generatedItems.push(generated);
      console.log(`✅ Success: ${generated.name}`);
    }
    
    // Slight delay to respect rate limits (Gemini free tier has 15 RPM)
    await new Promise(resolve => setTimeout(resolve, 4500));
  }

  const outPath = path.resolve(process.cwd(), 'scripts/generated-content.json');
  fs.writeFileSync(outPath, JSON.stringify(generatedItems, null, 2));
  
  console.log(`\n🎉 Generated ${generatedItems.length} products and saved to scripts/generated-content.json`);
  console.log(`Next step: Ingest this data to Supabase using:`);
  console.log(`node scripts/ingest.mjs scripts/generated-content.json`);
}

run();
