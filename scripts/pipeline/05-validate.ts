import * as fs from "fs";
import * as path from "path";
import { CATEGORIES, enrichedSoftwareSchema, relationsSchema } from "./config";

async function runValidate(category: string) {
  const enrichedPath = path.join(__dirname, "../../data/raw", `${category}-enriched.json`);
  const relationsPath = path.join(__dirname, "../../data/raw", `${category}-relations.json`);
  
  if (!fs.existsSync(enrichedPath) || !fs.existsSync(relationsPath)) {
    console.error(`Input files not found for category: ${category}`);
    return;
  }

  const enrichedData = JSON.parse(fs.readFileSync(enrichedPath, "utf-8"));
  const relationsData = JSON.parse(fs.readFileSync(relationsPath, "utf-8"));

  console.log(`Validating ${enrichedData.length} softwares and ${relationsData.length} relations...`);

  const passedSoftwares = [];
  const quarantinedSoftwares = [];

  for (const item of enrichedData) {
    try {
      // Structure validation
      enrichedSoftwareSchema.parse(item);
      
      // Quality gate validation
      if (item.ai_features.confidence < 0.85) {
        throw new Error(`Confidence score too low: ${item.ai_features.confidence}`);
      }

      passedSoftwares.push(item);
    } catch (error) {
      console.warn(`[QUARANTINE] Software failed validation: ${item.slug}`, error);
      quarantinedSoftwares.push(item);
    }
  }

  const passedRelations = [];
  const quarantinedRelations = [];

  // Create a fast lookup for passed softwares
  const passedSlugs = new Set(passedSoftwares.map(s => s.slug));

  for (const rel of relationsData) {
    try {
      if (!passedSlugs.has(rel.software_slug) || !passedSlugs.has(rel.alternative_slug)) {
        throw new Error("One or both softwares in relation did not pass validation.");
      }
      passedRelations.push(rel);
    } catch (error) {
      quarantinedRelations.push(rel);
    }
  }

  const outputDir = path.join(__dirname, "../../data/validated");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, `${category}-softwares.json`), JSON.stringify(passedSoftwares, null, 2));
  fs.writeFileSync(path.join(outputDir, `${category}-relations.json`), JSON.stringify(passedRelations, null, 2));

  fs.writeFileSync(path.join(outputDir, `${category}-quarantine.json`), JSON.stringify({
    softwares: quarantinedSoftwares,
    relations: quarantinedRelations
  }, null, 2));

  console.log(`Validation complete.`);
  console.log(`PASSED: ${passedSoftwares.length} softwares, ${passedRelations.length} relations.`);
  console.log(`QUARANTINED: ${quarantinedSoftwares.length} softwares, ${quarantinedRelations.length} relations.`);
}

async function main() {
  const categoryArg = process.argv[2];
  if (categoryArg && CATEGORIES.includes(categoryArg)) {
    await runValidate(categoryArg);
  } else {
    console.log(`Please provide a valid category. Options: ${CATEGORIES.join(", ")}`);
  }
}

main();
