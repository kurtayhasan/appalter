import * as fs from "fs";
import * as path from "path";
import { openai, CATEGORIES, relationsSchema, parseJsonSafely } from "./config";

async function runRelations(category: string) {
  const inputPath = path.join(__dirname, "../../data/raw", `${category}-enriched.json`);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    return;
  }

  const enrichedData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`Generating relations for ${enrichedData.length} items in category: ${category}`);

  // Create a simplified list for the prompt
  const softwareList = enrichedData.map((s: any) => ({ slug: s.slug, name: s.name, tagline: s.tagline }));

  const prompt = `
    I have a list of software applications in the same category.
    I want you to build an alternatives graph. For each software, identify its top 2-3 direct competitors from this exact list.
    
    Here is the list:
    ${JSON.stringify(softwareList, null, 2)}
    
    Return a JSON array of relationships exactly matching this schema:
    [
      {
        "software_slug": "slug-1",
        "alternative_slug": "slug-2",
        "similarity_score": 0.90,
        "reason": "Both are enterprise CRMs but slug-1 is better for sales while slug-2 is for marketing.",
        "core_difference": "A punchy 1-sentence comparison highlighting the main difference."
      }
    ]
    
    Only create relationships between items in the provided list. Do not invent slugs.
    Do not output any markdown. Pure JSON only.
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
    const parsedData = parseJsonSafely(content || "[]");
    
    // Validate with Zod
    const validatedData = relationsSchema.parse(parsedData);
    
    const outputPath = path.join(__dirname, "../../data/raw", `${category}-relations.json`);
    fs.writeFileSync(outputPath, JSON.stringify(validatedData, null, 2));
    
    console.log(`Successfully generated ${validatedData.length} relations and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to generate relations for ${category}:`, error);
  }
}

async function main() {
  const categoryArg = process.argv[2];
  if (categoryArg && CATEGORIES.includes(categoryArg)) {
    await runRelations(categoryArg);
  } else {
    console.log(`Please provide a valid category. Options: ${CATEGORIES.join(", ")}`);
  }
}

main();
