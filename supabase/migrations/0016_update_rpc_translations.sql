-- =============================================================================
-- AppAlter: MODULE 16 — Update RPC for Translations
-- Migration: 0016_update_rpc_translations.sql
-- Description: Updates get_software_by_slug to accept p_locale and merge translations
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_software_by_slug(TEXT);

CREATE OR REPLACE FUNCTION public.get_software_by_slug(p_slug TEXT, p_locale TEXT DEFAULT 'en')
RETURNS TABLE (
  id                  UUID,
  slug                TEXT,
  name                TEXT,
  tagline             TEXT,
  description         TEXT,
  short_description   TEXT,
  website_url         TEXT,
  logo_url            TEXT,
  og_image_url        TEXT,
  hero_image_url      TEXT,
  category_id         UUID,
  pricing_model_id    UUID,
  starting_price      NUMERIC,
  price_currency      CHAR(3),
  has_free_trial      BOOLEAN,
  free_trial_days     INTEGER,
  pricing_page_url    TEXT,
  pricing_notes       TEXT,
  developer_name      TEXT,
  developer_url       TEXT,
  github_url          TEXT,
  twitter_handle      TEXT,
  founded_year        SMALLINT,
  is_discontinued     BOOLEAN,
  meta_title          TEXT,
  meta_description    TEXT,
  focus_keywords      TEXT[],
  geo_summary         TEXT,
  ai_description      TEXT,
  ai_features         JSONB,
  review_count        INTEGER,
  avg_rating          NUMERIC,
  alternative_count   INTEGER,
  view_count          BIGINT,
  is_verified         BOOLEAN,
  is_featured         BOOLEAN,
  is_sponsored        BOOLEAN,
  data_quality_score  SMALLINT,
  price_rating        SMALLINT,
  ease_of_use_rating  SMALLINT,
  features_rating     SMALLINT,
  support_rating      SMALLINT,
  published_at        TIMESTAMPTZ,
  category_name       TEXT,
  category_slug       TEXT,
  pricing_model_name  TEXT,
  pricing_model_slug  TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.slug,
    COALESCE(t.name, s.name) AS name,
    COALESCE(t.tagline, s.tagline) AS tagline,
    COALESCE(t.description, s.description) AS description,
    COALESCE(t.short_description, s.short_description) AS short_description,
    s.website_url,
    s.logo_url,
    s.og_image_url,
    s.hero_image_url,
    s.category_id,
    s.pricing_model_id,
    s.starting_price,
    s.price_currency,
    s.has_free_trial,
    s.free_trial_days,
    s.pricing_page_url,
    COALESCE(s.pricing_notes, '') AS pricing_notes,
    s.developer_name,
    s.developer_url,
    s.github_url,
    s.twitter_handle,
    s.founded_year,
    s.is_discontinued,
    COALESCE(t.meta_title, s.meta_title) AS meta_title,
    COALESCE(t.meta_description, s.meta_description) AS meta_description,
    s.focus_keywords,
    COALESCE(t.geo_summary, s.geo_summary) AS geo_summary,
    s.ai_description,
    COALESCE(t.ai_features, s.ai_features) AS ai_features,
    s.review_count,
    s.avg_rating,
    s.alternative_count,
    s.view_count,
    s.is_verified,
    s.is_featured,
    s.is_sponsored,
    s.data_quality_score,
    s.price_rating,
    s.ease_of_use_rating,
    s.features_rating,
    s.support_rating,
    s.published_at,
    c.name   AS category_name,
    c.slug   AS category_slug,
    pm.name  AS pricing_model_name,
    pm.slug  AS pricing_model_slug
  FROM public.softwares s
  LEFT JOIN public.categories c ON c.id = s.category_id
  LEFT JOIN public.pricing_models pm ON pm.id = s.pricing_model_id
  LEFT JOIN public.software_translations t ON t.software_id = s.id AND t.locale = p_locale
  WHERE s.slug = p_slug
    AND s.status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.get_software_by_slug TO anon, authenticated;

-- =============================================================================
-- Update get_featured_softwares
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_featured_softwares(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_featured_softwares(
  p_category_id UUID    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 12,
  p_locale      TEXT    DEFAULT 'en'
)
RETURNS TABLE (
  id                UUID,
  slug              TEXT,
  name              TEXT,
  tagline           TEXT,
  short_description TEXT,
  logo_url          TEXT,
  avg_rating        NUMERIC,
  review_count      INTEGER,
  alternative_count INTEGER,
  starting_price    NUMERIC,
  price_currency    CHAR(3),
  is_sponsored      BOOLEAN,
  category_name     TEXT,
  category_slug     TEXT,
  pricing_model_slug TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.slug,
    COALESCE(t.name, s.name) AS name,
    COALESCE(t.tagline, s.tagline) AS tagline,
    COALESCE(t.short_description, s.short_description) AS short_description,
    s.logo_url,
    s.avg_rating,
    s.review_count,
    s.alternative_count,
    s.starting_price,
    s.price_currency,
    s.is_sponsored,
    COALESCE(ct.name, c.name) AS category_name,
    c.slug   AS category_slug,
    pm.slug  AS pricing_model_slug
  FROM public.softwares s
  LEFT JOIN public.categories c     ON c.id = s.category_id
  LEFT JOIN public.pricing_models pm ON pm.id = s.pricing_model_id
  LEFT JOIN public.software_translations t ON t.software_id = s.id AND t.locale = p_locale
  LEFT JOIN public.category_translations ct ON ct.category_id = c.id AND ct.locale = p_locale
  WHERE s.status = 'published'
    AND (p_category_id IS NULL OR s.category_id = p_category_id)
  ORDER BY
    s.is_sponsored DESC,
    s.sponsor_sort_boost DESC,
    s.is_featured DESC,
    s.avg_rating DESC NULLS LAST,
    s.view_count DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_featured_softwares TO anon, authenticated;

-- =============================================================================
-- Update get_alternatives_for_software
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_alternatives_for_software(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_alternatives_for_software(TEXT, INTEGER, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.get_alternatives_for_software(
  p_slug    TEXT,
  p_limit   INTEGER DEFAULT 12,
  p_offset  INTEGER DEFAULT 0,
  p_locale  TEXT    DEFAULT 'en'
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
  alternative_website_url TEXT,
  total_count       BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id                 AS relation_id,
    alt.id               AS alternative_id,
    alt.slug             AS alternative_slug,
    COALESCE(t.name, alt.name) AS alternative_name,
    alt.logo_url         AS alternative_logo,
    COALESCE(t.tagline, alt.tagline) AS tagline,
    COALESCE(t.short_description, alt.short_description) AS short_description,
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
      WHEN jsonb_typeof(COALESCE(t.ai_features, alt.ai_features)->'pros') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(t.ai_features, alt.ai_features)->'pros'))
      ELSE ARRAY[]::TEXT[]
    END AS pros,
    CASE 
      WHEN jsonb_typeof(COALESCE(t.ai_features, alt.ai_features)->'cons') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(t.ai_features, alt.ai_features)->'cons'))
      ELSE ARRAY[]::TEXT[]
    END AS cons,
    a.upvotes,
    a.downvotes,
    alt.website_url      AS alternative_website_url,
    COUNT(*) OVER()      AS total_count
  FROM public.alternatives a
  JOIN public.softwares src ON src.id = a.software_id
  JOIN public.softwares alt ON alt.id = a.alternative_id
  LEFT JOIN public.software_translations t ON t.software_id = alt.id AND t.locale = p_locale
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
