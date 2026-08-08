-- =============================================================================
-- Migration: Detailed Ratings and Downvotes
-- Adds detailed editorial ratings to softwares and downvote functionality to alternatives.
-- =============================================================================

-- 1. Add Detailed Rating Columns to softwares table
ALTER TABLE public.softwares
ADD COLUMN IF NOT EXISTS price_rating SMALLINT CHECK (price_rating BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS ease_of_use_rating SMALLINT CHECK (ease_of_use_rating BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS features_rating SMALLINT CHECK (features_rating BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS support_rating SMALLINT CHECK (support_rating BETWEEN 0 AND 10);

-- 2. Add downvotes column to alternatives table
ALTER TABLE public.alternatives
ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0;

-- 3. Modify alternative_votes to include vote_type (+1 for upvote, -1 for downvote)
ALTER TABLE public.alternative_votes
ADD COLUMN IF NOT EXISTS vote_type SMALLINT NOT NULL DEFAULT 1 CHECK (vote_type IN (1, -1));

-- 4. Create new RPC for atomic voting (Upvote or Downvote)
CREATE OR REPLACE FUNCTION public.vote_alternative(p_id UUID, p_vote_type SMALLINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_vote_type = 1 THEN
    UPDATE public.alternatives
    SET upvotes = upvotes + 1
    WHERE id = p_id;
  ELSIF p_vote_type = -1 THEN
    UPDATE public.alternatives
    SET downvotes = downvotes + 1
    WHERE id = p_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.vote_alternative TO anon, authenticated;

-- 5. Update get_software_by_slug to include detailed ratings
DROP FUNCTION IF EXISTS public.get_software_by_slug(TEXT);

CREATE OR REPLACE FUNCTION public.get_software_by_slug(p_slug TEXT)
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
    s.name,
    s.tagline,
    s.description,
    s.short_description,
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
    s.pricing_notes,
    s.developer_name,
    s.developer_url,
    s.github_url,
    s.twitter_handle,
    s.founded_year,
    s.is_discontinued,
    s.meta_title,
    s.meta_description,
    s.focus_keywords,
    s.geo_summary,
    s.ai_description,
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
  LEFT JOIN public.categories c     ON c.id = s.category_id
  LEFT JOIN public.pricing_models pm ON pm.id = s.pricing_model_id
  WHERE s.slug = p_slug
    AND s.status = 'published'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_software_by_slug TO anon, authenticated;

-- 6. Update get_alternatives_for_software to include downvotes
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
    a.pros,
    a.cons,
    a.upvotes,
    a.downvotes,
    alt.website_url AS alternative_website_url
  FROM public.alternatives a
  JOIN public.softwares s
    ON s.id = a.software_id
   AND s.slug = p_slug
   AND s.status = 'published'
  JOIN public.softwares alt
    ON alt.id = a.alternative_id
   AND alt.status = 'published'
  WHERE a.is_approved = TRUE
  ORDER BY
    (a.upvotes - a.downvotes) DESC NULLS LAST,
    a.similarity_score DESC NULLS LAST,
    a.migration_score DESC NULLS LAST,
    alt.avg_rating DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;
GRANT EXECUTE ON FUNCTION public.get_alternatives_for_software TO anon, authenticated;
