// scripts/10-translate.ts
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Yolları ve çevreyi ayarla
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openAiKey) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openAiKey });

const LOCALES = ["tr", "es", "de"];

async function main() {
  console.log("🚀 Starting bulk translation job...");

  // Get all published softwares
  const { data: softwares, error } = await supabase
    .from("softwares")
    .select("id, name, tagline, short_description, ai_features, slug")
    .eq("status", "published");

  if (error || !softwares) {
    console.error("Failed to fetch softwares", error);
    process.exit(1);
  }

  console.log(`Found ${softwares.length} softwares.`);

  // We want to skip if it's already translated for all locales.
  for (const sw of softwares) {
    // Check if translations exist
    const { data: translations } = await supabase
      .from("software_translations")
      .select("locale")
      .eq("software_id", sw.id);

    const existingLocales = (translations || []).map(t => t.locale);
    const missingLocales = LOCALES.filter(l => !existingLocales.includes(l));

    if (missingLocales.length === 0) {
      console.log(`✅ [${sw.slug}] Fully translated.`);
      continue;
    }

    console.log(`⏳ [${sw.slug}] Translating to ${missingLocales.join(", ")}...`);

    const prompt = `
Translate the following software metadata into the target languages: ${missingLocales.join(", ")}. Keep the tone professional, marketing-oriented, and engaging.

Original English Data:
Name: ${sw.name || ''}
Tagline: ${sw.tagline || ''}
Short Description: ${sw.short_description || ''}
AI Features (Pros, Cons, TLDR): ${JSON.stringify(sw.ai_features || {})}

Return a valid JSON object with the exact following structure for each requested language code:
{
  "tr": { "name": "...", "tagline": "...", "short_description": "...", "ai_features": { "pros": ["..."], "cons": ["..."], "tldr": "..." } } // only if "tr" is requested
}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional software localization expert. Always return JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      for (const locale of missingLocales) {
        if (result[locale]) {
          const trData = result[locale];
          
          await supabase.from("software_translations").upsert({
            software_id: sw.id,
            locale: locale,
            name: trData.name || null,
            tagline: trData.tagline || null,
            short_description: trData.short_description || null,
            ai_features: trData.ai_features || {},
            is_machine_translated: true,
            translated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'software_id,locale'
          });
        }
      }
      console.log(`✅ [${sw.slug}] Translations saved.`);
    } catch (err) {
      console.error(`❌ [${sw.slug}] Failed to translate:`, err);
    }
  }

  console.log("🎉 Bulk translation completed!");
}

main().catch(console.error);
