import * as dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
  console.error("Missing environment variables. Check .env.local");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const CATEGORIES = [
  "crm",
  "project-management",
  "email",
  "design"
];

// Zod schemas for AI Validation
export const discoverySchema = z.array(z.object({
  slug: z.string(),
  name: z.string(),
}));

export const normalizedSchema = z.array(z.object({
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  short_description: z.string(),
  website_url: z.string(),
  pricing_model_slug: z.string()
}));

export const aiFeaturesSchema = z.object({
  tldr: z.string(),
  pros: z.array(z.string()).max(3),
  cons: z.array(z.string()).max(3),
  pricing_model_type: z.string(),
  target_audience_size: z.string(),
  dealbreakers: z.array(z.string()),
  hidden_costs: z.array(z.string()),
  migration_difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  best_for: z.array(z.string()),
  not_for: z.array(z.string()),
  switching_reasons: z.array(z.string()),
  key_limitations: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

export const enrichedSoftwareSchema = z.object({
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  short_description: z.string(),
  website_url: z.string(),
  pricing_model_slug: z.string(),
  ai_features: aiFeaturesSchema
});

export const relationsSchema = z.array(z.object({
  software_slug: z.string(),
  alternative_slug: z.string(),
  similarity_score: z.number().min(0).max(1),
  reason: z.string(),
  core_difference: z.string()
}));

export function parseJsonSafely(content: string) {
  try {
    // Attempt standard parse first
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from markdown fences or extract the first [ / {
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    const objectMatch = content.match(/\{[\s\S]*\}/);
    
    let jsonStr = content;
    if (arrayMatch && objectMatch) {
      jsonStr = arrayMatch[0].length > objectMatch[0].length ? arrayMatch[0] : objectMatch[0];
    } else if (arrayMatch) {
      jsonStr = arrayMatch[0];
    } else if (objectMatch) {
      jsonStr = objectMatch[0];
    }
    
    // Clean up trailing commas if any
    jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1');
    
    return JSON.parse(jsonStr);
  }
}
