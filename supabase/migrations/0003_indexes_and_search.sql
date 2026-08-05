-- =============================================================================
-- AppAlter: MODULE 1 — INDEXES & SEARCH CONFIGURATION
-- Migration: 0003_indexes_and_search.sql
-- Description: All GIN, GiST, BTree, HNSW indexes + pg_trgm configuration
--              + full-text search vector trigger + hybrid search RPC.
--              Optimized for 1,000,000+ software records.
-- =============================================================================

-- =============================================================================
-- SECTION 1: SOFTWARES — PRIMARY INDEXES
-- =============================================================================

-- Slug lookups are the #1 read pattern (every page load)
CREATE INDEX IF NOT EXISTS idx_softwares_slug
  ON public.softwares (slug);

-- Status filter (published items are 95%+ of queries)
CREATE INDEX IF NOT EXISTS idx_softwares_status
  ON public.softwares (status)
  WHERE status = 'published';

-- Category browsing
CREATE INDEX IF NOT EXISTS idx_softwares_category_id
  ON public.softwares (category_id)
  WHERE status = 'published';

-- Pricing model filter
CREATE INDEX IF NOT EXISTS idx_softwares_pricing_model_id
  ON public.softwares (pricing_model_id)
  WHERE status = 'published';

-- Featured items (small set, fast lookup)
CREATE INDEX IF NOT EXISTS idx_softwares_featured
  ON public.softwares (is_featured, sponsor_sort_boost DESC)
  WHERE status = 'published' AND is_featured = TRUE;

-- Rating sort
CREATE INDEX IF NOT EXISTS idx_softwares_avg_rating
  ON public.softwares (avg_rating DESC NULLS LAST)
  WHERE status = 'published';

-- Review count sort
CREATE INDEX IF NOT EXISTS idx_softwares_review_count
  ON public.softwares (review_count DESC)
  WHERE status = 'published';

-- Alternative count (for "most alternatives" pages)
CREATE INDEX IF NOT EXISTS idx_softwares_alternative_count
  ON public.softwares (alternative_count DESC)
  WHERE status = 'published';

-- View count (trending)
CREATE INDEX IF NOT EXISTS idx_softwares_view_count
  ON public.softwares (view_count DESC)
  WHERE status = 'published';

-- Published_at for chronological feeds
CREATE INDEX IF NOT EXISTS idx_softwares_published_at
  ON public.softwares (published_at DESC)
  WHERE status = 'published';

-- Crawl queue
CREATE INDEX IF NOT EXISTS idx_softwares_next_crawl
  ON public.softwares (next_crawl_at ASC NULLS FIRST, crawl_priority DESC)
  WHERE status = 'published' AND next_crawl_at IS NOT NULL;

-- Import source tracing
CREATE INDEX IF NOT EXISTS idx_softwares_import_source_id
  ON public.softwares (import_source_id)
  WHERE import_source_id IS NOT NULL;

-- =============================================================================
-- SECTION 2: FULL-TEXT SEARCH VECTOR
-- =============================================================================

-- GIN index on search_vector (tsvector) — used by @@ operator
CREATE INDEX IF NOT EXISTS idx_softwares_search_vector_gin
  ON public.softwares USING GIN (search_vector);

-- Trigger: maintain search_vector on INSERT / UPDATE
CREATE OR REPLACE FUNCTION public.softwares_update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    -- Weight A: name (highest priority)
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    -- Weight B: tagline + focus_keywords
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.focus_keywords, ' '), '')), 'B') ||
    -- Weight C: short_description + developer_name
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.developer_name, '')), 'C') ||
    -- Weight D: description + geo_summary
    setweight(to_tsvector('english', COALESCE(LEFT(NEW.description, 2000), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.geo_summary, '')), 'D');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_softwares_search_vector
  BEFORE INSERT OR UPDATE OF
    name, tagline, focus_keywords, short_description,
    developer_name, description, geo_summary
  ON public.softwares
  FOR EACH ROW EXECUTE FUNCTION public.softwares_update_search_vector();

-- =============================================================================
-- SECTION 3: pg_trgm INDEXES (fuzzy / autocomplete search)
-- =============================================================================

-- Trigram on name for ILIKE / similarity() queries
CREATE INDEX IF NOT EXISTS idx_softwares_name_trgm
  ON public.softwares USING GIN (name gin_trgm_ops)
  WHERE status = 'published';

-- Trigram on slug for fuzzy slug resolution (typo-tolerant URLs)
CREATE INDEX IF NOT EXISTS idx_softwares_slug_trgm
  ON public.softwares USING GIN (slug gin_trgm_ops);

-- Trigram on developer_name (brand search)
CREATE INDEX IF NOT EXISTS idx_softwares_developer_trgm
  ON public.softwares USING GIN (developer_name gin_trgm_ops)
  WHERE developer_name IS NOT NULL AND status = 'published';

-- =============================================================================
-- SECTION 4: VECTOR SEARCH INDEXES (pgvector HNSW)
-- =============================================================================

-- HNSW index for ANN semantic search (text-embedding-3-small, 1536d)
-- m=16, ef_construction=64 is a good default for up to 1M rows
CREATE INDEX IF NOT EXISTS idx_software_embeddings_hnsw_1536
  ON public.software_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- HNSW index for 768d embeddings (Google fallback)
CREATE INDEX IF NOT EXISTS idx_software_embeddings_hnsw_768
  ON public.software_embeddings USING hnsw (embedding_768 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- SECTION 5: ALTERNATIVES / GRAPH INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_alternatives_software_id
  ON public.alternatives (software_id, similarity_score DESC)
  WHERE is_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_alternatives_alternative_id
  ON public.alternatives (alternative_id, similarity_score DESC)
  WHERE is_approved = TRUE;

-- Composite: find top alternatives for a software sorted by similarity
CREATE INDEX IF NOT EXISTS idx_alternatives_soft_sim
  ON public.alternatives (software_id, similarity_score DESC NULLS LAST, migration_score DESC NULLS LAST)
  WHERE is_approved = TRUE;

-- =============================================================================
-- SECTION 6: CONTENT TABLE INDEXES
-- =============================================================================

-- software_features
CREATE INDEX IF NOT EXISTS idx_software_features_software_id
  ON public.software_features (software_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_software_features_locale
  ON public.software_features (software_id, locale);

-- software_use_cases
CREATE INDEX IF NOT EXISTS idx_software_use_cases_software_id
  ON public.software_use_cases (software_id, sort_order);

-- software_pros_cons
CREATE INDEX IF NOT EXISTS idx_software_pros_cons_software_type
  ON public.software_pros_cons (software_id, type, sort_order);

-- software_faqs
CREATE INDEX IF NOT EXISTS idx_software_faqs_software_id
  ON public.software_faqs (software_id, sort_order)
  WHERE is_featured = TRUE OR is_featured = FALSE;  -- covers all

-- software_reviews
CREATE INDEX IF NOT EXISTS idx_software_reviews_software_id
  ON public.software_reviews (software_id, rating DESC, created_at DESC)
  WHERE is_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_software_reviews_user_id
  ON public.software_reviews (user_id)
  WHERE user_id IS NOT NULL;

-- software_screenshots
CREATE INDEX IF NOT EXISTS idx_software_screenshots_software_id
  ON public.software_screenshots (software_id, sort_order);

-- software_integrations
CREATE INDEX IF NOT EXISTS idx_software_integrations_software_id
  ON public.software_integrations (software_id);

CREATE INDEX IF NOT EXISTS idx_software_integrations_integrated_with
  ON public.software_integrations (integrated_with);

-- =============================================================================
-- SECTION 7: CATEGORIES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON public.categories (slug);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories (parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
  ON public.categories USING GIN (name gin_trgm_ops)
  WHERE is_active = TRUE;

-- =============================================================================
-- SECTION 8: SLUG HISTORY & REDIRECTS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug
  ON public.slug_history (old_slug, entity_type);

CREATE INDEX IF NOT EXISTS idx_redirects_from_path
  ON public.redirects (from_path)
  WHERE is_active = TRUE;

-- =============================================================================
-- SECTION 9: OPERATIONAL TABLE INDEXES
-- =============================================================================

-- search_logs
CREATE INDEX IF NOT EXISTS idx_search_logs_query
  ON public.search_logs (query);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at
  ON public.search_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_logs_session
  ON public.search_logs (session_id)
  WHERE session_id IS NOT NULL;

-- change_logs
CREATE INDEX IF NOT EXISTS idx_change_logs_status_priority
  ON public.change_logs (status, priority DESC, created_at ASC)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_change_logs_software_id
  ON public.change_logs (software_id)
  WHERE software_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_change_logs_import_source
  ON public.change_logs (import_source_id, created_at DESC);

-- editorial_workflow
CREATE INDEX IF NOT EXISTS idx_editorial_workflow_status
  ON public.editorial_workflow (status, priority DESC);

CREATE INDEX IF NOT EXISTS idx_editorial_workflow_assignee
  ON public.editorial_workflow (assignee_id)
  WHERE assignee_id IS NOT NULL;

-- entity_deduplication
CREATE INDEX IF NOT EXISTS idx_entity_dedup_source_id
  ON public.entity_deduplication (source_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_entity_dedup_status
  ON public.entity_deduplication (status)
  WHERE status = 'pending';

-- affiliate_links
CREATE INDEX IF NOT EXISTS idx_affiliate_links_software_id
  ON public.affiliate_links (software_id)
  WHERE is_active = TRUE;

-- affiliate_clicks
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_id
  ON public.affiliate_clicks (affiliate_link_id, created_at DESC);

-- software_translations
CREATE INDEX IF NOT EXISTS idx_software_translations_lookup
  ON public.software_translations (software_id, locale);

-- software_aliases
CREATE INDEX IF NOT EXISTS idx_software_aliases_slug
  ON public.software_aliases (alias_slug);

CREATE INDEX IF NOT EXISTS idx_software_aliases_software_id
  ON public.software_aliases (software_id);

-- =============================================================================
-- SECTION 10: HYBRID SEARCH RPC FUNCTION
-- =============================================================================
-- This function combines:
--   1. Full-text search (tsvector GIN) with ts_rank_cd for relevance
--   2. Trigram similarity (pg_trgm) for fuzzy / typo-tolerance
--   3. Vector cosine similarity (pgvector HNSW) for semantic matching
--   4. Weighted final score (configurable weights)
--   5. Hard filters: status=published, optional category/pricing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_softwares(
  query_text        TEXT,
  query_embedding   VECTOR(1536)  DEFAULT NULL,
  p_category_id     UUID          DEFAULT NULL,
  p_pricing_model_id UUID         DEFAULT NULL,
  p_platforms       UUID[]        DEFAULT NULL,
  p_locale          CHAR(5)       DEFAULT 'en',
  weight_fts        FLOAT         DEFAULT 0.40,    -- full-text weight
  weight_trgm       FLOAT         DEFAULT 0.20,    -- trigram weight
  weight_vector     FLOAT         DEFAULT 0.35,    -- semantic weight
  weight_popularity FLOAT         DEFAULT 0.05,    -- view/review count weight
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
  -- Normalize text query to tsquery (handle empty input gracefully)
  BEGIN
    ts_query := plainto_tsquery('english', query_text);
  EXCEPTION WHEN OTHERS THEN
    ts_query := NULL;
  END;

  -- Determine max view count for popularity normalization (cached in practice)
  SELECT COALESCE(MAX(view_count), 1)::FLOAT
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

      -- Full-text relevance (0-1 range, ts_rank_cd normalizes by doc length)
      CASE
        WHEN ts_query IS NOT NULL AND s.search_vector @@ ts_query
          THEN ts_rank_cd(s.search_vector, ts_query, 32)::FLOAT
        ELSE 0.0
      END AS fts_score,

      -- Trigram similarity (0-1)
      GREATEST(
        similarity(s.name, query_text),
        similarity(COALESCE(s.tagline, ''), query_text) * 0.5
      ) AS trgm_score,

      -- Vector semantic similarity (0-1, only computed when embedding provided)
      CASE
        WHEN query_embedding IS NOT NULL THEN
          COALESCE(
            1.0 - (se.embedding <=> query_embedding),
            0.0
          )
        ELSE 0.0
      END AS vector_score,

      -- Popularity score (normalized 0-1)
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
        -- Include if any search signal matches
        (ts_query IS NOT NULL AND s.search_vector @@ ts_query)
        OR similarity(s.name, query_text) > 0.15
        OR (query_embedding IS NOT NULL)
      )
  ),
  scored AS (
    SELECT
      base.*,
      -- Weighted combined score + sponsored boost
      (
        (base.fts_score    * weight_fts)
      + (base.trgm_score   * weight_trgm)
      + (base.vector_score * weight_vector)
      + (base.popularity_score_raw * weight_popularity)
      -- Sponsored boost: float the sponsor higher but never fake relevance
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

COMMENT ON FUNCTION public.search_softwares IS
  'Hybrid search: combines BM25 full-text (tsvector), trigram (pg_trgm), '
  'and vector cosine (pgvector) scores into a single weighted ranking. '
  'Supports category, pricing, and platform filters.';

-- Grant execute to anon and authenticated (RLS on underlying tables enforced)
GRANT EXECUTE ON FUNCTION public.search_softwares TO anon, authenticated;

-- =============================================================================
-- SECTION 11: HELPER RPCs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- RPC: get_alternatives_for_software
-- Returns the top N alternatives for a given software slug with rich data.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_alternatives_for_software(
  p_slug    TEXT,
  p_limit   INTEGER DEFAULT 12,
  p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
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
  cons              TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
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
    a.cons
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
    a.similarity_score DESC NULLS LAST,
    a.migration_score DESC NULLS LAST,
    alt.avg_rating DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_alternatives_for_software TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get_software_by_slug
-- Single-row fetch with all joined content (avoids N+1 on page load).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RPC: resolve_slug_or_redirect
-- Used in middleware to resolve a slug to its canonical target or redirect.
-- Returns (found, canonical_slug, redirect_target, status_code).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_slug_or_redirect(p_slug TEXT)
RETURNS TABLE (
  found          BOOLEAN,
  canonical_slug TEXT,
  redirect_slug  TEXT,
  status_code    SMALLINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Check if slug exists as a current software slug
  SELECT
    TRUE            AS found,
    s.slug          AS canonical_slug,
    NULL::TEXT      AS redirect_slug,
    NULL::SMALLINT  AS status_code
  FROM public.softwares s
  WHERE s.slug = p_slug AND s.status = 'published'

  UNION ALL

  -- Check slug_history for 301 redirect
  SELECT
    TRUE             AS found,
    sh.new_slug      AS canonical_slug,
    sh.new_slug      AS redirect_slug,
    301::SMALLINT    AS status_code
  FROM public.slug_history sh
  WHERE sh.old_slug = p_slug AND sh.entity_type = 'software'

  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_slug_or_redirect TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: increment_view_count (atomic, no full row lock)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_software_view(p_id UUID)
RETURNS VOID
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  UPDATE public.softwares
  SET view_count = view_count + 1
  WHERE id = p_id AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_software_view TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: recalculate_review_stats (called by trigger after review insert/update)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.softwares s
  SET
    review_count = stats.cnt,
    avg_rating   = stats.avg_r,
    updated_at   = NOW()
  FROM (
    SELECT
      software_id,
      COUNT(*)::INTEGER         AS cnt,
      ROUND(AVG(rating)::NUMERIC, 2) AS avg_r
    FROM public.software_reviews
    WHERE software_id = COALESCE(NEW.software_id, OLD.software_id)
      AND is_approved = TRUE
    GROUP BY software_id
  ) stats
  WHERE s.id = stats.software_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalculate_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.software_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_review_stats();

-- ---------------------------------------------------------------------------
-- RPC: recalculate_alternative_count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_alternative_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update count for the source software
  UPDATE public.softwares
  SET alternative_count = (
    SELECT COUNT(*) FROM public.alternatives
    WHERE software_id = COALESCE(NEW.software_id, OLD.software_id)
      AND is_approved = TRUE
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.software_id, OLD.software_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalculate_alternative_count
  AFTER INSERT OR UPDATE OR DELETE ON public.alternatives
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_alternative_count();

-- ---------------------------------------------------------------------------
-- Slug history: auto-record slug changes for 301 redirects
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_slug_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO public.slug_history (old_slug, new_slug, entity_type, entity_id)
    VALUES (OLD.slug, NEW.slug, 'software', NEW.id)
    ON CONFLICT (old_slug, entity_type) DO UPDATE
      SET new_slug = EXCLUDED.new_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_slug_change
  AFTER UPDATE OF slug ON public.softwares
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION public.record_slug_change();

-- =============================================================================
-- SECTION 12: MATERIALIZED VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- MV: mv_software_stats — pre-aggregated stats for dashboard
-- Refresh: scheduled via pg_cron every hour
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_software_stats AS
SELECT
  c.id                            AS category_id,
  c.name                          AS category_name,
  c.slug                          AS category_slug,
  COUNT(s.id)                     AS total_softwares,
  COUNT(s.id) FILTER (WHERE s.pricing_model_id IN (
    SELECT id FROM public.pricing_models WHERE slug = 'free'
  ))                              AS free_count,
  COUNT(s.id) FILTER (WHERE s.is_featured = TRUE) AS featured_count,
  ROUND(AVG(s.avg_rating), 2)    AS avg_rating,
  SUM(s.review_count)            AS total_reviews,
  SUM(s.alternative_count)       AS total_alternatives,
  MAX(s.published_at)            AS last_published_at
FROM public.categories c
JOIN public.softwares s ON s.category_id = c.id AND s.status = 'published'
GROUP BY c.id, c.name, c.slug
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_software_stats_category_id
  ON public.mv_software_stats (category_id);

COMMENT ON MATERIALIZED VIEW public.mv_software_stats IS
  'Pre-aggregated software statistics per category. Refresh hourly.';

-- ---------------------------------------------------------------------------
-- MV: mv_top_alternatives — precomputed for homepage / category pages
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_top_alternatives AS
SELECT
  a.software_id,
  a.alternative_id,
  s.name        AS software_name,
  s.slug        AS software_slug,
  alt.name      AS alternative_name,
  alt.slug      AS alternative_slug,
  alt.logo_url  AS alternative_logo,
  alt.avg_rating,
  a.similarity_score,
  a.migration_score,
  ROW_NUMBER() OVER (
    PARTITION BY a.software_id
    ORDER BY a.similarity_score DESC, alt.avg_rating DESC
  ) AS rank
FROM public.alternatives a
JOIN public.softwares s   ON s.id = a.software_id   AND s.status = 'published'
JOIN public.softwares alt ON alt.id = a.alternative_id AND alt.status = 'published'
WHERE a.is_approved = TRUE
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_top_alternatives_software_id
  ON public.mv_top_alternatives (software_id, rank);

COMMENT ON MATERIALIZED VIEW public.mv_top_alternatives IS
  'Precomputed top alternatives per software. Refresh on alternatives change.';
