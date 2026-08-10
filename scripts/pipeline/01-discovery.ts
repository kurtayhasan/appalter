import * as fs from "fs";
import * as path from "path";
import { geminiModel, CATEGORIES, discoverySchema, parseJsonSafely } from "./config";

async function runDiscovery(category: string, count: number = 30) {
  console.log(`Starting discovery for category: ${category} (Target: ${count} items)`);
  
  const prompt = `
    You are an expert software directory builder. I need to discover exactly ${count} popular, widely-used real SaaS applications in the "${category}" category.
    Do NOT invent any software. Only return real, verifiable softwares.
    
    Return the response as a pure JSON array matching this schema:
    [{ "slug": "software-name-slug", "name": "Software Name" }]
    
    Ensure the JSON is perfectly formatted. Do not include markdown formatting or explanations.
  `;

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const content = result.response.text();
    const parsedData = parseJsonSafely(content);
    
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
