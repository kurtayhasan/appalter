-- =============================================================================
-- Migration: Seed AI Tools
-- Adds popular AI tools with logos, categories, and alternatives.
-- =============================================================================

DO $$
DECLARE
  v_ai_cat UUID;
  v_dev_cat UUID;
  v_freemium UUID;
  v_paid UUID;
  
  v_chatgpt UUID := gen_random_uuid();
  v_claude UUID := gen_random_uuid();
  v_gemini UUID := gen_random_uuid();
  v_cursor UUID := gen_random_uuid();
  v_copilot UUID := gen_random_uuid();
  v_midjourney UUID := gen_random_uuid();
BEGIN
  -- Get Categories
  SELECT id INTO v_ai_cat FROM public.categories WHERE slug = 'ai';
  SELECT id INTO v_dev_cat FROM public.categories WHERE slug = 'development';
  
  -- Get Pricing models
  SELECT id INTO v_freemium FROM public.pricing_models WHERE slug = 'freemium';
  SELECT id INTO v_paid FROM public.pricing_models WHERE slug = 'paid';

  -- 1. Insert AI Tools
  INSERT INTO public.softwares (
    id, slug, name, tagline, short_description, website_url, logo_url, hero_image_url, 
    category_id, pricing_model_id, status, is_featured, review_count, avg_rating
  ) VALUES
  (
    v_chatgpt, 'chatgpt', 'ChatGPT', 'The AI model that started the revolution', 
    'ChatGPT by OpenAI is a powerful conversational AI model capable of answering questions, writing code, and brainstorming ideas.', 
    'https://chatgpt.com', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200&h=600',
    v_ai_cat, v_freemium, 'published', true, 1250, 4.8
  ),
  (
    v_claude, 'claude', 'Claude', 'Safe, accurate, and secure AI', 
    'Claude by Anthropic is an advanced AI assistant built for safety, large context windows, and highly nuanced reasoning.', 
    'https://claude.ai', 'https://mintlify.s3-us-west-1.amazonaws.com/anthropic/logo/dark.svg', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200&h=600',
    v_ai_cat, v_freemium, 'published', true, 850, 4.9
  ),
  (
    v_gemini, 'gemini', 'Gemini', 'Google''s most capable and general AI model', 
    'Gemini is deeply integrated into Google Workspace and provides powerful multimodal AI capabilities including text, code, and vision.', 
    'https://gemini.google.com', 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=1200&h=600',
    v_ai_cat, v_freemium, 'published', false, 420, 4.5
  ),
  (
    v_cursor, 'cursor', 'Cursor', 'The AI-first code editor for developers', 
    'Cursor is a fork of VS Code built from the ground up for AI-assisted programming, featuring deep codebase understanding.', 
    'https://cursor.sh', 'https://mintlify.s3-us-west-1.amazonaws.com/cursor/logo/dark.svg', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200&h=600',
    v_dev_cat, v_freemium, 'published', true, 630, 4.9
  ),
  (
    v_copilot, 'github-copilot', 'GitHub Copilot', 'Your AI pair programmer', 
    'GitHub Copilot provides real-time code suggestions and chat directly within your IDE to speed up development.', 
    'https://github.com/features/copilot', 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=1200&h=600',
    v_dev_cat, v_paid, 'published', true, 1100, 4.6
  ),
  (
    v_midjourney, 'midjourney', 'Midjourney', 'High quality AI image generation', 
    'Midjourney is an AI image generator accessed via Discord that creates stunningly artistic and photorealistic images from text.', 
    'https://midjourney.com', 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png', 'https://images.unsplash.com/photo-1682695794816-7b9da18ed470?auto=format&fit=crop&q=80&w=1200&h=600',
    v_ai_cat, v_paid, 'published', false, 950, 4.8
  )
  ON CONFLICT (slug) DO NOTHING;

  -- 2. Link Alternatives
  -- ChatGPT vs Claude
  INSERT INTO public.alternatives (software_id, alternative_id, similarity_score, is_approved)
  VALUES (v_chatgpt, v_claude, 0.95, true), (v_claude, v_chatgpt, 0.95, true)
  ON CONFLICT DO NOTHING;

  -- ChatGPT vs Gemini
  INSERT INTO public.alternatives (software_id, alternative_id, similarity_score, is_approved)
  VALUES (v_chatgpt, v_gemini, 0.90, true), (v_gemini, v_chatgpt, 0.90, true)
  ON CONFLICT DO NOTHING;
  
  -- Claude vs Gemini
  INSERT INTO public.alternatives (software_id, alternative_id, similarity_score, is_approved)
  VALUES (v_claude, v_gemini, 0.88, true), (v_gemini, v_claude, 0.88, true)
  ON CONFLICT DO NOTHING;

  -- Cursor vs GitHub Copilot
  INSERT INTO public.alternatives (software_id, alternative_id, similarity_score, is_approved)
  VALUES (v_cursor, v_copilot, 0.92, true), (v_copilot, v_cursor, 0.92, true)
  ON CONFLICT DO NOTHING;

END $$;
