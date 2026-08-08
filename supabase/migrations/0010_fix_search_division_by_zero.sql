-- =============================================================================
-- Migration: Fix Search Division By Zero
-- Description: 
-- Prevents division by zero error in search_softwares when all view_counts are 0.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_softwares(
  query_text        TEXT,
  query_embedding   VECTOR(1536)  DEFAULT NULL,
  p_category_id     UUID          DEFAULT NULL,
  p_pricing_model_id UUID         DEFAULT NULL,
  p_platforms       UUID[]        DEFAULT NULL,
  p_locale          CHAR(5)       DEFAULT 'en',
  weight_fts        FLOAT         DEFAULT 0.40,
  weight_trgm       FLOAT         DEFAULT 0.20,
  weight_vector     FLOAT         DEFAULT 0.35,
  weight_popularity FLOAT         DEFAULT 0.05,
  p_limit           INTEGER       DEFAULT 20,
  p_offset          INTEGER       DEFAULT 0
)
RETURNS TABLE (
  id                UUID,
  slug              TEXT,
  name              TEXT,
  tagline           TEXT,
  short_description TEXT,
  logo_url          TEXT,
  category_id       UUID,
  pricing_model_id  UUID,
  starting_price    NUMERIC,
  avg_rating        NUMERIC,
  review_count      INTEGER,
  alternative_count INTEGER,
  is_featured       BOOLEAN,
  is_sponsored      BOOLEAN,
  fts_score         FLOAT,
  trgm_score        FLOAT,
  vector_score      FLOAT,
  popularity_score  FLOAT,
  combined_score    FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  ts_query    TSQUERY;
  max_views   FLOAT;
BEGIN
  -- Normalize text query to tsquery
  BEGIN
    ts_query := plainto_tsquery('english', query_text);
  EXCEPTION WHEN OTHERS THEN
    ts_query := NULL;
  END;

  -- Fix for division by zero: Ensure max_views is at least 1
  SELECT GREATEST(MAX(view_count), 1)::FLOAT
    INTO max_views
    FROM public.softwares
   WHERE status = 'published';

  RETURN QUERY
  WITH base AS (
    SELECT
      s.id,
      s.slug,
      s.name,
      s.tagline,
      s.short_description,
      s.logo_url,
      s.category_id,
      s.pricing_model_id,
      s.starting_price,
      s.avg_rating,
      s.review_count,
      s.alternative_count,
      s.is_featured,
      s.is_sponsored,
      s.sponsor_sort_boost,
      s.view_count,

      CASE
        WHEN ts_query IS NOT NULL AND s.search_vector @@ ts_query
          THEN ts_rank_cd(s.search_vector, ts_query, 32)::FLOAT
        ELSE 0.0
      END AS fts_score,

      GREATEST(
        similarity(s.name, query_text),
        similarity(COALESCE(s.tagline, ''), query_text) * 0.5
      ) AS trgm_score,

      CASE
        WHEN query_embedding IS NOT NULL THEN
          COALESCE(
            1.0 - (se.embedding <=> query_embedding),
            0.0
          )
        ELSE 0.0
      END AS vector_score,

      LEAST(1.0, s.view_count::FLOAT / max_views) AS popularity_score_raw

    FROM public.softwares s
    LEFT JOIN public.software_embeddings se
      ON se.software_id = s.id
    WHERE
      s.status = 'published'
      AND (p_category_id IS NULL OR s.category_id = p_category_id)
      AND (p_pricing_model_id IS NULL OR s.pricing_model_id = p_pricing_model_id)
      AND (
        p_platforms IS NULL
        OR EXISTS (
          SELECT 1 FROM public.software_platforms sp
          WHERE sp.software_id = s.id
            AND sp.platform_id = ANY(p_platforms)
        )
      )
      AND (
        (ts_query IS NOT NULL AND s.search_vector @@ ts_query)
        OR similarity(s.name, query_text) > 0.15
        OR (query_embedding IS NOT NULL)
      )
  ),
  scored AS (
    SELECT
      base.*,
      (
        (base.fts_score    * weight_fts)
      + (base.trgm_score   * weight_trgm)
      + (base.vector_score * weight_vector)
      + (base.popularity_score_raw * weight_popularity)
      + (base.sponsor_sort_boost::FLOAT / 100.0 * 0.1)
      ) AS combined_score_raw
    FROM base
  )
  SELECT
    scored.id,
    scored.slug,
    scored.name,
    scored.tagline,
    scored.short_description,
    scored.logo_url,
    scored.category_id,
    scored.pricing_model_id,
    scored.starting_price,
    scored.avg_rating,
    scored.review_count,
    scored.alternative_count,
    scored.is_featured,
    scored.is_sponsored,
    scored.fts_score::FLOAT,
    scored.trgm_score::FLOAT,
    scored.vector_score::FLOAT,
    scored.popularity_score_raw::FLOAT,
    scored.combined_score_raw::FLOAT
  FROM scored
  ORDER BY scored.combined_score_raw DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
