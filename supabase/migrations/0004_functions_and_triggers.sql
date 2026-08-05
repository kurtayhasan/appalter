-- =============================================================================
-- AppAlter: MODULE 1 — FUNCTIONS, TRIGGERS & SEED DATA
-- Migration: 0004_functions_and_triggers.sql
-- Description: Audit logging trigger, data quality scoring, category count
--              maintenance, affiliate click counter, search log normalization,
--              and pg_cron schedules for MV refresh.
-- =============================================================================

-- =============================================================================
-- SECTION 1: GENERIC AUDIT LOG TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr(),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_softwares
  AFTER INSERT OR UPDATE OR DELETE ON public.softwares
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_alternatives
  AFTER INSERT OR UPDATE OR DELETE ON public.alternatives
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_affiliate_links
  AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- =============================================================================
-- SECTION 2: DATA QUALITY SCORE COMPUTATION
-- =============================================================================
-- Scores 0-100 based on completeness of key fields.
-- Called on software INSERT/UPDATE to maintain the score automatically.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.compute_data_quality_score(p_id UUID)
RETURNS SMALLINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  rec         public.softwares%ROWTYPE;
  score       INTEGER := 0;
  has_features BOOLEAN;
  has_faqs     BOOLEAN;
  has_screenshots BOOLEAN;
  has_pros_cons BOOLEAN;
BEGIN
  SELECT * INTO rec FROM public.softwares WHERE id = p_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Core identity (25 pts total)
  IF rec.name            IS NOT NULL THEN score := score + 5; END IF;
  IF rec.slug            IS NOT NULL THEN score := score + 3; END IF;
  IF rec.tagline         IS NOT NULL THEN score := score + 5; END IF;
  IF rec.description     IS NOT NULL AND LENGTH(rec.description) > 200 THEN score := score + 7; END IF;
  IF rec.logo_url        IS NOT NULL THEN score := score + 5; END IF;

  -- SEO fields (20 pts)
  IF rec.meta_title       IS NOT NULL THEN score := score + 5; END IF;
  IF rec.meta_description IS NOT NULL THEN score := score + 5; END IF;
  IF rec.focus_keywords   IS NOT NULL AND array_length(rec.focus_keywords, 1) > 0 THEN score := score + 5; END IF;
  IF rec.geo_summary      IS NOT NULL THEN score := score + 5; END IF;

  -- Taxonomy (15 pts)
  IF rec.category_id       IS NOT NULL THEN score := score + 8; END IF;
  IF rec.pricing_model_id  IS NOT NULL THEN score := score + 7; END IF;

  -- Vendor info (10 pts)
  IF rec.website_url        IS NOT NULL THEN score := score + 5; END IF;
  IF rec.developer_name     IS NOT NULL THEN score := score + 3; END IF;
  IF rec.documentation_url  IS NOT NULL THEN score := score + 2; END IF;

  -- Related content (30 pts)
  SELECT EXISTS(SELECT 1 FROM public.software_features WHERE software_id = p_id LIMIT 1)
    INTO has_features;
  SELECT EXISTS(SELECT 1 FROM public.software_faqs WHERE software_id = p_id LIMIT 1)
    INTO has_faqs;
  SELECT EXISTS(SELECT 1 FROM public.software_screenshots WHERE software_id = p_id LIMIT 1)
    INTO has_screenshots;
  SELECT EXISTS(SELECT 1 FROM public.software_pros_cons WHERE software_id = p_id LIMIT 1)
    INTO has_pros_cons;

  IF has_features    THEN score := score + 10; END IF;
  IF has_faqs        THEN score := score + 8;  END IF;
  IF has_screenshots THEN score := score + 7;  END IF;
  IF has_pros_cons   THEN score := score + 5;  END IF;

  RETURN LEAST(100, score)::SMALLINT;
END;
$$;

-- Trigger to update quality score whenever software changes
CREATE OR REPLACE FUNCTION public.update_data_quality_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.data_quality_score := public.compute_data_quality_score(NEW.id);
  RETURN NEW;
END;
$$;

-- Note: Use AFTER trigger calling a deferred update to avoid recursion
CREATE OR REPLACE FUNCTION public.update_data_quality_score_deferred()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.softwares
  SET data_quality_score = public.compute_data_quality_score(COALESCE(NEW.software_id, OLD.software_id))
  WHERE id = COALESCE(NEW.software_id, OLD.software_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recompute quality score when features/faqs/screenshots/pros_cons change
CREATE TRIGGER trg_quality_score_features
  AFTER INSERT OR UPDATE OR DELETE ON public.software_features
  FOR EACH ROW EXECUTE FUNCTION public.update_data_quality_score_deferred();

CREATE TRIGGER trg_quality_score_faqs
  AFTER INSERT OR UPDATE OR DELETE ON public.software_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_data_quality_score_deferred();

CREATE TRIGGER trg_quality_score_screenshots
  AFTER INSERT OR UPDATE OR DELETE ON public.software_screenshots
  FOR EACH ROW EXECUTE FUNCTION public.update_data_quality_score_deferred();

CREATE TRIGGER trg_quality_score_pros_cons
  AFTER INSERT OR UPDATE OR DELETE ON public.software_pros_cons
  FOR EACH ROW EXECUTE FUNCTION public.update_data_quality_score_deferred();

-- =============================================================================
-- SECTION 3: CATEGORY SOFTWARE COUNT MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.maintain_category_software_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_category_id UUID;
BEGIN
  affected_category_id := COALESCE(NEW.category_id, OLD.category_id);

  IF affected_category_id IS NOT NULL THEN
    UPDATE public.categories
    SET software_count = (
      SELECT COUNT(*)
      FROM public.softwares
      WHERE category_id = affected_category_id
        AND status = 'published'
    ),
    updated_at = NOW()
    WHERE id = affected_category_id;
  END IF;

  -- Handle category change (old category also needs update)
  IF TG_OP = 'UPDATE'
    AND OLD.category_id IS DISTINCT FROM NEW.category_id
    AND OLD.category_id IS NOT NULL
  THEN
    UPDATE public.categories
    SET software_count = (
      SELECT COUNT(*)
      FROM public.softwares
      WHERE category_id = OLD.category_id
        AND status = 'published'
    ),
    updated_at = NOW()
    WHERE id = OLD.category_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_category_count
  AFTER INSERT OR UPDATE OR DELETE ON public.softwares
  FOR EACH ROW EXECUTE FUNCTION public.maintain_category_software_count();

-- =============================================================================
-- SECTION 4: COLLECTION ITEM COUNT MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.maintain_collection_item_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.collections
  SET item_count = (
    SELECT COUNT(*) FROM public.collection_items
    WHERE collection_id = COALESCE(NEW.collection_id, OLD.collection_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_collection_item_count
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.maintain_collection_item_count();

-- =============================================================================
-- SECTION 5: AFFILIATE CLICK COUNTER MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.maintain_affiliate_link_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment click count on the affiliate_link
  UPDATE public.affiliate_links
  SET click_count = click_count + 1,
      updated_at  = NOW()
  WHERE id = NEW.affiliate_link_id;

  -- Increment on the software too
  UPDATE public.softwares
  SET click_count = click_count + 1
  WHERE id = (
    SELECT software_id FROM public.affiliate_links WHERE id = NEW.affiliate_link_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_click_counter
  AFTER INSERT ON public.affiliate_clicks
  FOR EACH ROW EXECUTE FUNCTION public.maintain_affiliate_link_counts();

-- =============================================================================
-- SECTION 6: SEARCH LOG NORMALIZATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.normalize_search_query()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize: lowercase, trim, collapse whitespace
  NEW.normalized_query := regexp_replace(
    lower(trim(NEW.query)),
    '\s+', ' ', 'g'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_search_query
  BEFORE INSERT ON public.search_logs
  FOR EACH ROW EXECUTE FUNCTION public.normalize_search_query();

-- =============================================================================
-- SECTION 7: AUTO-PUBLISH TRIGGER
-- When status changes to 'published', set published_at if not set.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.published_at := COALESCE(NEW.published_at, NOW());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_published_at
  BEFORE UPDATE OF status ON public.softwares
  FOR EACH ROW EXECUTE FUNCTION public.set_published_at();

-- =============================================================================
-- SECTION 8: EDITORIAL WORKFLOW STATUS SYNC
-- When editorial_workflow.status changes to 'published',
-- also update softwares.status to 'published'.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_editorial_to_software()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    UPDATE public.softwares
    SET status       = 'published',
        published_at = COALESCE(published_at, NOW()),
        reviewed_by  = NEW.reviewer_id,
        reviewed_at  = NOW(),
        updated_at   = NOW()
    WHERE id = NEW.software_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.softwares
    SET status     = 'rejected',
        updated_at = NOW()
    WHERE id = NEW.software_id AND status IN ('draft', 'review');
  ELSIF NEW.status = 'archived' THEN
    UPDATE public.softwares
    SET status     = 'archived',
        updated_at = NOW()
    WHERE id = NEW.software_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_editorial_to_software
  AFTER UPDATE OF status ON public.editorial_workflow
  FOR EACH ROW EXECUTE FUNCTION public.sync_editorial_to_software();

-- =============================================================================
-- SECTION 9: IMPORT SOURCES — SUCCESS/ERROR COUNTER MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_import_source_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a change_log transitions to 'applied', increment success count
  IF NEW.status = 'applied' AND (OLD.status IS DISTINCT FROM 'applied') THEN
    UPDATE public.import_sources
    SET success_count   = success_count + 1,
        last_fetched_at = NOW(),
        last_error      = NULL,
        updated_at      = NOW()
    WHERE id = NEW.import_source_id;

  -- When a change_log fails, increment error count and store message
  ELSIF NEW.status = 'failed' AND (OLD.status IS DISTINCT FROM 'failed') THEN
    UPDATE public.import_sources
    SET error_count = error_count + 1,
        last_error  = NEW.error_message,
        updated_at  = NOW()
    WHERE id = NEW.import_source_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_import_source_stats
  AFTER UPDATE OF status ON public.change_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_import_source_stats();

-- =============================================================================
-- SECTION 10: UTILITY FUNCTIONS FOR APPLICATION LAYER
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_featured_softwares: fast homepage / category hero fetch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_featured_softwares(
  p_category_id UUID    DEFAULT NULL,
  p_limit       INTEGER DEFAULT 12
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
    s.name,
    s.tagline,
    s.short_description,
    s.logo_url,
    s.avg_rating,
    s.review_count,
    s.alternative_count,
    s.starting_price,
    s.price_currency,
    s.is_sponsored,
    c.name   AS category_name,
    c.slug   AS category_slug,
    pm.slug  AS pricing_model_slug
  FROM public.softwares s
  LEFT JOIN public.categories c     ON c.id = s.category_id
  LEFT JOIN public.pricing_models pm ON pm.id = s.pricing_model_id
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

-- ---------------------------------------------------------------------------
-- get_software_for_sitemap: returns slugs + updated_at for sitemap generation
-- Used in Next.js sitemap.ts — paginates 50k at a time.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_software_for_sitemap(
  p_limit  INTEGER DEFAULT 50000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  slug       TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT slug, updated_at
  FROM public.softwares
  WHERE status = 'published'
  ORDER BY updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_software_for_sitemap TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_comparisons_for_sitemap: returns all software/alternative slug pairs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_comparisons_for_sitemap(
  p_limit  INTEGER DEFAULT 50000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  software_slug    TEXT,
  alternative_slug TEXT,
  updated_at       TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.slug      AS software_slug,
    alt.slug    AS alternative_slug,
    GREATEST(a.updated_at, s.updated_at, alt.updated_at) AS updated_at
  FROM public.alternatives a
  JOIN public.softwares s   ON s.id = a.software_id   AND s.status = 'published'
  JOIN public.softwares alt ON alt.id = a.alternative_id AND alt.status = 'published'
  WHERE a.is_approved = TRUE
  ORDER BY updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_comparisons_for_sitemap TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_categories_for_sitemap
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_categories_for_sitemap()
RETURNS TABLE (
  slug       TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT slug, updated_at
  FROM public.categories
  WHERE is_active = TRUE
  ORDER BY updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_categories_for_sitemap TO anon, authenticated;

-- =============================================================================
-- SECTION 11: PERFORMANCE — STATISTICS UPDATE
-- =============================================================================

-- Refresh PostgreSQL planner statistics after bulk inserts
-- (call after each large import batch via the ingest pipeline)
CREATE OR REPLACE FUNCTION public.analyze_search_tables()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE public.softwares;
  ANALYZE public.alternatives;
  ANALYZE public.software_embeddings;
END;
$$;

-- Only admins/service role may call this
REVOKE EXECUTE ON FUNCTION public.analyze_search_tables FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analyze_search_tables TO authenticated;
