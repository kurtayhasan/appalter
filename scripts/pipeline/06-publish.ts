import * as fs from "fs";
import * as path from "path";
import { supabase, CATEGORIES } from "./config";

async function getCategoryId(slug: string) {
  const { data, error } = await supabase.from("categories").select("id").eq("slug", slug).single();
  if (error || !data) {
    throw new Error(`Category not found: ${slug}`);
  }
  return data.id;
}

async function getPricingModelId(slug: string) {
  const { data, error } = await supabase.from("pricing_models").select("id").eq("slug", slug).single();
  if (error || !data) {
    // Return a default if needed, or throw
    const { data: defaultModel } = await supabase.from("pricing_models").select("id").limit(1).single();
    return defaultModel?.id;
  }
  return data.id;
}

async function runPublish(category: string) {
  const validatedPath = path.join(__dirname, "../../data/validated", `${category}-softwares.json`);
  const relationsPath = path.join(__dirname, "../../data/validated", `${category}-relations.json`);

  if (!fs.existsSync(validatedPath) || !fs.existsSync(relationsPath)) {
    console.error(`Validated files not found for category: ${category}`);
    return;
  }

  const softwares = JSON.parse(fs.readFileSync(validatedPath, "utf-8"));
  const relations = JSON.parse(fs.readFileSync(relationsPath, "utf-8"));

  console.log(`Publishing ${softwares.length} softwares...`);
  
  const categoryId = await getCategoryId(category);
  const slugToIdMap = new Map<string, string>();

  // Insert or update softwares
  for (const sw of softwares) {
    const pricingModelId = await getPricingModelId(sw.pricing_model_slug);
    
    const { data, error } = await supabase
      .from("softwares")
      .upsert({
        slug: sw.slug,
        name: sw.name,
        tagline: sw.tagline,
        short_description: sw.short_description,
        website_url: sw.website_url,
        category_id: categoryId,
        pricing_model_id: pricingModelId,
        ai_features: sw.ai_features,
        status: "published",
        is_verified: false // Set to true after manual review if needed
      }, { onConflict: "slug" })
      .select("id")
      .single();

    if (error) {
      console.error(`Error publishing ${sw.slug}:`, error);
    } else {
      slugToIdMap.set(sw.slug, data.id);
      console.log(`Published software: ${sw.slug}`);
    }
  }

  console.log(`Publishing ${relations.length} relations...`);

  // Insert or update relations
  for (const rel of relations) {
    const swId = slugToIdMap.get(rel.software_slug);
    const altId = slugToIdMap.get(rel.alternative_slug);

    if (!swId || !altId) {
      console.warn(`Skipping relation ${rel.software_slug} -> ${rel.alternative_slug} (IDs not found)`);
      continue;
    }

    const { error } = await supabase
      .from("alternatives")
      .upsert({
        software_id: swId,
        alternative_id: altId,
        similarity_score: rel.similarity_score,
        reason: rel.reason,
        core_difference: rel.core_difference,
        is_approved: true, // Auto approve because it passed validation
        is_indexable: true // Auto indexable
      }, { onConflict: "software_id, alternative_id" });

    if (error) {
      console.error(`Error publishing relation ${rel.software_slug} -> ${rel.alternative_slug}:`, error);
    } else {
      console.log(`Published relation: ${rel.software_slug} -> ${rel.alternative_slug}`);
    }
  }

  console.log("Publishing completed successfully.");
}

async function main() {
  const categoryArg = process.argv[2];
  if (categoryArg && CATEGORIES.includes(categoryArg)) {
    await runPublish(categoryArg);
  } else {
    console.log(`Please provide a valid category. Options: ${CATEGORIES.join(", ")}`);
  }
}

main();
