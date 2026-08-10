import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// We don't instantiate OpenAI at module level to avoid build errors if env var is missing during build time

export async function translateSoftwareData(softwareId: string, record: any) {
  const targetLocales = ["tr", "es", "de"];
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log(`Starting translation for software ${softwareId} to ${targetLocales.join(', ')}...`);

  // Create a structured prompt for OpenAI
  const prompt = `
Translate the following software metadata into the target languages. Keep the tone professional, marketing-oriented, and engaging.

Original English Data:
Name: ${record.name || ''}
Tagline: ${record.tagline || ''}
Short Description: ${record.short_description || ''}
AI Features (Pros, Cons, TLDR): ${JSON.stringify(record.ai_features || {})}

Return a valid JSON object with the exact following structure for each language code ("tr", "es", "de"):
{
  "tr": { "name": "...", "tagline": "...", "short_description": "...", "ai_features": { "pros": ["..."], "cons": ["..."], "tldr": "..." } },
  "es": { "name": "...", "tagline": "...", "short_description": "...", "ai_features": { "pros": ["..."], "cons": ["..."], "tldr": "..." } },
  "de": { "name": "...", "tagline": "...", "short_description": "...", "ai_features": { "pros": ["..."], "cons": ["..."], "tldr": "..." } }
}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional software localization expert." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices?.[0]?.message?.content || "{}");

    // Upsert into Supabase for each language
    for (const locale of targetLocales) {
      if (result[locale]) {
        const trData = result[locale];
        
        await supabase.from("software_translations").upsert({
          software_id: softwareId,
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
    console.log(`Translations completed for software ${softwareId}.`);

  } catch (err) {
    console.error("Translation failed:", err);
  }
}
