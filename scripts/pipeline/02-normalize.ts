import * as fs from "fs";
import * as path from "path";
import { geminiModel, CATEGORIES, normalizedSchema, parseJsonSafely } from "./config";

async function runNormalize(category: string) {
  const inputPath = path.join(__dirname, "../../data/raw", `${category}-discovery.json`);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    return;
  }

  const discoveryData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`Normalizing ${discoveryData.length} items for category: ${category}`);

  const prompt = `
    I have a list of software applications. For each one, provide standard normalized data.
    
    Here is the list:
    ${JSON.stringify(discoveryData, null, 2)}
    
    For each software, provide:
    - slug: the exact slug from the input
    - name: the exact name from the input
    - tagline: A very short 3-6 word tagline (e.g. "The complete CRM platform")
    - short_description: A 1-2 sentence description
    - website_url: The official homepage URL
    - pricing_model_slug: One of ["freemium", "open-source", "paid-only", "free"]
    
    Return the response as a pure JSON array matching this schema perfectly.
    Do not include markdown formatting, HTML tags, or explanations.
  `;

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const content = result.response.text();
    const parsedData = parseJsonSafely(content);
    
    // Validate with Zod
    const validatedData = normalizedSchema.parse(parsedData);
    
    const outputPath = path.join(__dirname, "../../data/raw", `${category}-normalized.json`);
    fs.writeFileSync(outputPath, JSON.stringify(validatedData, null, 2));
    
    console.log(`Successfully normalized ${validatedData.length} items and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to normalize data for ${category}:`, error);
  }
}

async function main() {
  const categoryArg = process.argv[2];
  if (categoryArg && CATEGORIES.includes(categoryArg)) {
    await runNormalize(categoryArg);
  } else {
    console.log(`Please provide a valid category. Options: ${CATEGORIES.join(", ")}`);
  }
}

main();
