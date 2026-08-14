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
    I want you to build an alternatives graph. Identify the top 20 most important comparison pairs (e.g., Mailchimp vs Brevo, SendGrid vs Mailgun, etc.).
    
    Here is the list:
    ${JSON.stringify(softwareList, null, 2)}
    
    CRITICAL RULES:
    1. NEVER alter/translate product brand names (keep Notion, Jira, Slack, etc. exact).
    2. Be concise to save tokens.
    
    Return a JSON object with a "relations" key containing an array of at most 20 relationships:
    {
      "relations": [
        {
          "software_slug": "slug-1",
          "alternative_slug": "slug-2",
          "similarity_score": 0.90,
          "reason": "1 short sentence why they compete.",
          "core_difference": "1 punchy sentence highlighting the main difference."
        }
      ]
    }
    
    Only create relationships between items in the provided list. Do not invent slugs.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise SaaS comparison generator. Always output valid JSON object with a 'relations' array. Keep brand names exact." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    const parsedObj = JSON.parse(content || "{}");
    const rawRelations = parsedObj.relations || parsedObj;
    
    // Validate with Zod
    const validatedData = relationsSchema.parse(Array.isArray(rawRelations) ? rawRelations : []);
    
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
