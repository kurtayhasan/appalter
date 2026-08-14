import * as fs from "fs";
import * as path from "path";
import { openai, supabase, CATEGORIES, discoverySchema, parseJsonSafely } from "./config";

async function runDiscovery(category: string, count: number = 35) {
  console.log(`Starting discovery for category: ${category} (Target: ${count} items)`);
  
  // Fetch existing softwares to prevent duplicate or conflicting slugs
  const { data: existingSoftwares } = await supabase.from("softwares").select("slug, name");
  const existingList = (existingSoftwares || []).map(s => `${s.name} (slug: ${s.slug})`).join(", ");

  const prompt = `
    You are an expert software directory builder. I need to discover exactly ${count} popular, widely-used real SaaS applications in the "${category}" category.
    Do NOT invent any software. Only return real, verifiable softwares.
    
    IMPORTANT: Here are some already existing softwares in our database:
    ${existingList.slice(0, 1500)}

    If any of these existing softwares belong to "${category}" (e.g. ChatGPT, Claude, Cursor for AI tools), USE THE EXACT SAME SLUG as listed above so they update correctly without creating duplicate records.
    
    Return the response as a pure JSON array matching this schema:
    [{ "slug": "software-name-slug", "name": "Software Name" }]
    
    Ensure the JSON is perfectly formatted. Do not include markdown formatting or explanations.
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

    const content = response.choices[0]?.message?.content;
    const parsedData = parseJsonSafely(content || "[]");
    
    // Validate with Zod
    const validatedData = discoverySchema.parse(parsedData);
    
    const outputPath = path.join(__dirname, "../../data/raw", `${category}-discovery.json`);
    fs.writeFileSync(outputPath, JSON.stringify(validatedData, null, 2));
    
    console.log(`Successfully discovered ${validatedData.length} items and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to run discovery for ${category}:`, error);
  }
}

async function main() {
  const categoryArg = process.argv[2];
  if (categoryArg && CATEGORIES.includes(categoryArg)) {
    await runDiscovery(categoryArg);
  } else {
    console.log(`Please provide a valid category. Options: ${CATEGORIES.join(", ")}`);
    console.log(`Example: ts-node 01-discovery.ts crm`);
  }
}

main();
