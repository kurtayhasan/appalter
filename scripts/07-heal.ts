import { openai, aiFeaturesSchema, parseJsonSafely, supabase } from "./pipeline/config";

async function enrichSoftware(software: any) {
  const prompt = `
    Analyze the software: ${software.name} (${software.slug}).
    This is a software in the B2B SaaS space.

    I need you to generate highly specific, UX-optimized metadata for it.
    
    Provide the data in a JSON object exactly matching this schema:
    {
      "tldr": "A single sentence punchy sales pitch for why a user should choose this software.",
      "pros": ["3 short bullet points (max 5-7 words each)"],
      "cons": ["3 short bullet points (max 5-7 words each)"],
      "pricing_model_type": "One of: Freemium, Open Source, Paid Only, Free",
      "target_audience_size": "One of: Solo, Startup, Enterprise, Any",
      "dealbreakers": ["1 or 2 specific reasons someone should NOT use this"],
      "hidden_costs": ["1 or 2 common hidden costs"],
      "migration_difficulty": "easy, medium, hard, or expert",
      "best_for": ["2 specific use cases"],
      "not_for": ["2 specific anti-use cases"],
      "switching_reasons": ["2 reasons people switch away from this"],
      "key_limitations": ["2 technical or feature limitations"],
      "confidence": 0.95 // A score between 0.0 and 1.0 indicating how confident you are in this data
    }
    
    Output purely valid JSON. No markdown tags. No explanations.
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
    const parsedData = parseJsonSafely(content || "{}");
    
    // Validate with Zod
    return aiFeaturesSchema.parse(parsedData);
  } catch (error) {
    console.error(`Failed to enrich software ${software.slug}:`, error);
    return null;
  }
}

async function runHeal() {
  console.log("Fetching all published softwares from database to find missing ai_features...");
  
  let allSoftwares: any[] = [];
  let page = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from("softwares")
      .select("*")
      .eq("status", "published")
      .range(page * limit, (page + 1) * limit - 1);
      
    if (error) {
      console.error("Error fetching softwares:", error);
      process.exit(1);
    }
    
    if (data.length === 0) break;
    
    allSoftwares = [...allSoftwares, ...data];
    page++;
  }

  // Filter missing ones
  const missingAi = allSoftwares.filter(sw => {
    const ai = sw.ai_features;
    return !ai || Object.keys(ai).length === 0 || !ai.pros || !ai.cons;
  });

  console.log(`\nFound ${missingAi.length} softwares missing AI features out of ${allSoftwares.length} total.`);
  
  if (missingAi.length === 0) {
    console.log("Everything is already healthy. Exiting.");
    return;
  }

  let successCount = 0;
  let failedCount = 0;

  for (const sw of missingAi) {
    console.log(`\n[${successCount + failedCount + 1}/${missingAi.length}] Healing ${sw.name} (${sw.slug})...`);
    
    let ai_features = null;
    let retries = 3;
    
    while (retries > 0) {
      ai_features = await enrichSoftware(sw);
      if (ai_features) break;
      
      console.log(`Retrying ${sw.slug} in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries--;
    }
    
    if (ai_features) {
      // Update directly in Supabase
      const { error: updateError } = await supabase
        .from("softwares")
        .update({ ai_features })
        .eq("id", sw.id);
        
      if (updateError) {
        console.error(`Failed to update DB for ${sw.slug}:`, updateError);
        failedCount++;
      } else {
        console.log(`✅ Successfully updated ${sw.slug} in DB.`);
        successCount++;
      }
    } else {
      console.error(`❌ Failed to generate ai_features for ${sw.slug} after 3 retries.`);
      failedCount++;
    }
    
    // Add a 2 second delay to avoid OpenAI rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\nHealing complete!`);
  console.log(`Successfully healed: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
}

runHeal();
