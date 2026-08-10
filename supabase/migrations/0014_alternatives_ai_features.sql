-- =============================================================================
-- Migration: Update get_alternatives_for_software for AI Features
-- Description:
-- 1. Updates get_alternatives_for_software to fetch pros/cons from softwares.ai_features
-- 2. Includes core_difference from alternatives table
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_alternatives_for_software(TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_alternatives_for_software(
  p_slug    TEXT,
  p_limit   INTEGER DEFAULT 12,
  p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
  relation_id       UUID,
  alternative_id    UUID,
  alternative_slug  TEXT,
  alternative_name  TEXT,
  alternative_logo  TEXT,
  tagline           TEXT,
  short_description TEXT,
  avg_rating        NUMERIC,
  review_count      INTEGER,
  starting_price    NUMERIC,
  price_currency    CHAR(3),
  pricing_model_id  UUID,
  similarity_score  NUMERIC,
  migration_score   NUMERIC,
  difficulty        TEXT,
  reason            TEXT,
  core_difference   TEXT,
  pros              TEXT[],
  cons              TEXT[],
  upvotes           INTEGER,
  downvotes         INTEGER,
  alternative_website_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id                 AS relation_id,
    alt.id               AS alternative_id,
    alt.slug             AS alternative_slug,
    alt.name             AS alternative_name,
    alt.logo_url         AS alternative_logo,
    alt.tagline,
    alt.short_description,
    alt.avg_rating,
    alt.review_count,
    alt.starting_price,
    alt.price_currency,
    alt.pricing_model_id,
    a.similarity_score,
    a.migration_score,
    a.difficulty,
    a.reason,
    a.core_difference,
    CASE 
      WHEN jsonb_typeof(alt.ai_features->'pros') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(alt.ai_features->'pros'))
      ELSE ARRAY[]::TEXT[]
    END AS pros,
    CASE 
      WHEN jsonb_typeof(alt.ai_features->'cons') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(alt.ai_features->'cons'))
      ELSE ARRAY[]::TEXT[]
    END AS cons,
    a.upvotes,
    a.downvotes,
    alt.website_url      AS alternative_website_url
  FROM public.alternatives a
  JOIN public.softwares src ON src.id = a.software_id
  JOIN public.softwares alt ON alt.id = a.alternative_id
  WHERE src.slug = p_slug
    AND a.is_approved = TRUE
    AND alt.status = 'published'
  ORDER BY 
    a.similarity_score DESC NULLS LAST,
    alt.avg_rating DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_alternatives_for_software TO anon, authenticated;
