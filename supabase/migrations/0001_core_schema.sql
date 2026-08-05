-- =============================================================================
-- AppAlter: MODULE 1 — CORE SCHEMA MIGRATION
-- Migration: 0001_core_schema.sql
-- Description: Full production schema for AppAlter programmatic SEO platform.
--              Supports 1,000,000+ software records, multilingual content,
--              hybrid search (GIN + Trigram + pgvector), affiliate tracking,
--              editorial workflows, and AI/GEO optimization.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
-- pg_search (Supabase ParadeDB) — provides @@@  operator for full-text BM25
-- Enable in Supabase Dashboard → Extensions if not already enabled.
-- CREATE EXTENSION IF NOT EXISTS "pg_search";

-- ---------------------------------------------------------------------------
-- UTILITY: updated_at auto-trigger function (shared across all tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- UTILITY: Generate a URL-safe slug from any text
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      lower(trim(input)),
      '[^a-z0-9\-]', '-', 'g'
    ),
    '-{2,}', '-', 'g'
  );
END;
$$;

-- =============================================================================
-- SECTION 1: LOOKUP / TAXONOMY TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  parent_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon_url        TEXT,
  image_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  software_count  INTEGER NOT NULL DEFAULT 0,   -- denormalized for perf
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- i18n columns (primary language stored here; translations in separate table)
  name            TEXT NOT NULL,
  description     TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9\-]+$')
);

COMMENT ON TABLE public.categories IS 'Hierarchical taxonomy for software products (e.g. "Project Management > Kanban").';

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 1.2 platforms
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platforms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  icon_url    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platforms_slug_format CHECK (slug ~ '^[a-z0-9\-]+$')
);

COMMENT ON TABLE public.platforms IS 'Target platforms: Web, macOS, Windows, Linux, iOS, Android, etc.';

CREATE TRIGGER trg_platforms_updated_at
  BEFORE UPDATE ON public.platforms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 1.3 pricing_models
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_models (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Examples: 'free', 'freemium', 'paid', 'subscription', 'open-source',
  --           'one-time', 'usage-based', 'enterprise'
  CONSTRAINT pricing_models_slug_format CHECK (slug ~ '^[a-z0-9\-]+$')
);

COMMENT ON TABLE public.pricing_models IS 'Pricing model taxonomy (Free, Freemium, Paid, Open Source, etc.).';

CREATE TRIGGER trg_pricing_models_updated_at
  BEFORE UPDATE ON public.pricing_models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 2: CORE ENTITY — softwares
-- =============================================================================

-- Status enum
CREATE TYPE public.software_status AS ENUM (
  'draft',
  'review',
  'published',
  'archived',
  'rejected'
);

CREATE TABLE IF NOT EXISTS public.softwares (
  -- Identity
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  canonical_url       TEXT,                          -- override canonical if needed

  -- Primary metadata
  name                TEXT NOT NULL,
  tagline             TEXT,                          -- one-liner, max 160 chars
  description         TEXT,                          -- long description (markdown)
  short_description   TEXT,                          -- ≤ 300 chars, used in cards
  website_url         TEXT,
  logo_url            TEXT,
  og_image_url        TEXT,
  hero_image_url      TEXT,

  -- Taxonomy
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  pricing_model_id    UUID REFERENCES public.pricing_models(id) ON DELETE SET NULL,

  -- Pricing detail
  starting_price      NUMERIC(10,2),
  price_currency      CHAR(3) NOT NULL DEFAULT 'USD',
  has_free_trial      BOOLEAN NOT NULL DEFAULT FALSE,
  free_trial_days     INTEGER,
  pricing_page_url    TEXT,
  pricing_notes       TEXT,                          -- e.g. "per seat / month"

  -- Vendor info
  developer_name      TEXT,
  developer_url       TEXT,
  support_url         TEXT,
  documentation_url   TEXT,
  github_url          TEXT,
  twitter_handle      TEXT,
  linkedin_url        TEXT,

  -- Lifecycle
  founded_year        SMALLINT,
  last_major_update   DATE,
  is_discontinued     BOOLEAN NOT NULL DEFAULT FALSE,
  discontinued_at     TIMESTAMPTZ,
  replacement_id      UUID REFERENCES public.softwares(id) ON DELETE SET NULL,

  -- SEO / AI
  meta_title          TEXT,
  meta_description    TEXT,                          -- ≤ 160 chars
  focus_keywords      TEXT[],                        -- primary kw array
  geo_summary         TEXT,                          -- LLM-optimized plain text
  ai_description      TEXT,                          -- structured for AI consumers
  schema_type         TEXT NOT NULL DEFAULT 'SoftwareApplication',

  -- Aggregate signals (denormalized from materialized view or triggers)
  review_count        INTEGER NOT NULL DEFAULT 0,
  avg_rating          NUMERIC(3,2),
  alternative_count   INTEGER NOT NULL DEFAULT 0,
  view_count          BIGINT NOT NULL DEFAULT 0,
  click_count         BIGINT NOT NULL DEFAULT 0,

  -- Quality & trust
  data_quality_score  SMALLINT DEFAULT 0 CHECK (data_quality_score BETWEEN 0 AND 100),
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_sponsored        BOOLEAN NOT NULL DEFAULT FALSE,
  sponsor_sort_boost  SMALLINT NOT NULL DEFAULT 0,

  -- Operational
  status              public.software_status NOT NULL DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  submitted_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  last_crawled_at     TIMESTAMPTZ,
  next_crawl_at       TIMESTAMPTZ,
  crawl_priority      SMALLINT NOT NULL DEFAULT 5 CHECK (crawl_priority BETWEEN 1 AND 10),
  import_source_id    UUID,                          -- FK set later (circular dep)

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Search vector (updated by trigger)
  search_vector       TSVECTOR,

  CONSTRAINT softwares_slug_format CHECK (slug ~ '^[a-z0-9\-]+$'),
  CONSTRAINT softwares_avg_rating_range CHECK (avg_rating IS NULL OR avg_rating BETWEEN 0 AND 5),
  CONSTRAINT softwares_tagline_length CHECK (char_length(tagline) <= 200),
  CONSTRAINT softwares_meta_description_length CHECK (char_length(meta_description) <= 320)
);

COMMENT ON TABLE public.softwares IS 'Master table for all software products. Supports 1M+ rows.';
COMMENT ON COLUMN public.softwares.geo_summary IS 'Plain-text summary optimized for LLM/AI search (GEO).';
COMMENT ON COLUMN public.softwares.search_vector IS 'Auto-maintained tsvector for full-text search.';
COMMENT ON COLUMN public.softwares.data_quality_score IS '0-100 score computed from completeness of fields.';

CREATE TRIGGER trg_softwares_updated_at
  BEFORE UPDATE ON public.softwares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- software_platforms (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_platforms (
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (software_id, platform_id)
);

COMMENT ON TABLE public.software_platforms IS 'Which platforms a software product supports.';

-- ---------------------------------------------------------------------------
-- software_aliases (e.g. "Visual Studio Code" → "VS Code")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_aliases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,
  alias_slug  TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  locale      CHAR(5),                               -- NULL = universal alias
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (software_id, alias_slug),
  CONSTRAINT software_aliases_alias_slug_format CHECK (alias_slug ~ '^[a-z0-9\-]+$')
);

COMMENT ON TABLE public.software_aliases IS 'Alternative names / abbreviations for a software product.';

CREATE TRIGGER trg_software_aliases_updated_at
  BEFORE UPDATE ON public.software_aliases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 3: CONTENT TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 software_features
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  icon_url    TEXT,
  is_core     BOOLEAN NOT NULL DEFAULT FALSE,
  is_unique   BOOLEAN NOT NULL DEFAULT FALSE,        -- differentiating feature?
  sort_order  INTEGER NOT NULL DEFAULT 0,
  locale      CHAR(5) NOT NULL DEFAULT 'en',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_features IS 'Key features of a software product (multilingual).';

CREATE TRIGGER trg_software_features_updated_at
  BEFORE UPDATE ON public.software_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.2 software_use_cases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_use_cases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  audience    TEXT,                                  -- e.g. "Small Teams", "Enterprises"
  sort_order  INTEGER NOT NULL DEFAULT 0,
  locale      CHAR(5) NOT NULL DEFAULT 'en',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_use_cases IS 'Specific use cases and target audiences for a software product.';

CREATE TRIGGER trg_software_use_cases_updated_at
  BEFORE UPDATE ON public.software_use_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.3 software_pros_cons
-- ---------------------------------------------------------------------------
CREATE TYPE public.pro_con_type AS ENUM ('pro', 'con');

CREATE TABLE IF NOT EXISTS public.software_pros_cons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  type        public.pro_con_type NOT NULL,
  content     TEXT NOT NULL,
  source      TEXT,                                  -- 'editorial' | 'user' | 'ai'
  upvotes     INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  locale      CHAR(5) NOT NULL DEFAULT 'en',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_pros_cons IS 'Editorial and user-submitted pros and cons for software.';

CREATE TRIGGER trg_software_pros_cons_updated_at
  BEFORE UPDATE ON public.software_pros_cons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.4 software_faqs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,                         -- Markdown supported
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  locale      CHAR(5) NOT NULL DEFAULT 'en',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_faqs IS 'FAQs for each software — powers FAQPage JSON-LD schema.';

CREATE TRIGGER trg_software_faqs_updated_at
  BEFORE UPDATE ON public.software_faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.5 software_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id     UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name   TEXT,
  reviewer_role   TEXT,                              -- e.g. "CTO", "Freelancer"
  reviewer_avatar TEXT,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  body            TEXT NOT NULL,
  source          TEXT NOT NULL DEFAULT 'user',      -- 'user' | 'editorial' | 'imported'
  source_url      TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count   INTEGER NOT NULL DEFAULT 0,
  locale          CHAR(5) NOT NULL DEFAULT 'en',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_reviews IS 'User and editorial reviews for software products.';

CREATE TRIGGER trg_software_reviews_updated_at
  BEFORE UPDATE ON public.software_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.6 software_screenshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_screenshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  thumb_url   TEXT,
  alt_text    TEXT,
  caption     TEXT,
  width       INTEGER,
  height      INTEGER,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  locale      CHAR(5),                               -- NULL = all locales
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_screenshots IS 'Product screenshots for galleries and Open Graph previews.';

CREATE TRIGGER trg_software_screenshots_updated_at
  BEFORE UPDATE ON public.software_screenshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 4: GRAPH / RELATIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 alternatives (core graph edge)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alternatives (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id         UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  alternative_id      UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,

  -- Scores (0.00 – 1.00)
  similarity_score    NUMERIC(4,3) CHECK (similarity_score BETWEEN 0 AND 1),
  migration_score     NUMERIC(4,3) CHECK (migration_score BETWEEN 0 AND 1),
                                                     -- 1.0 = trivial migration

  -- Qualitative
  reason              TEXT,                          -- Why is this an alternative?
  pros                TEXT[],                        -- advantages over software_id
  cons                TEXT[],                        -- disadvantages vs software_id
  difficulty          TEXT CHECK (difficulty IN ('easy','medium','hard','expert')),
  recommended_for     TEXT[],                        -- audience segments

  -- Editorial
  is_editorial        BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved         BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (software_id, alternative_id),
  CONSTRAINT alternatives_no_self_loop CHECK (software_id <> alternative_id)
);

COMMENT ON TABLE public.alternatives IS 'Directed graph of software alternatives with rich metadata.';

CREATE TRIGGER trg_alternatives_updated_at
  BEFORE UPDATE ON public.alternatives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4.2 software_integrations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id     UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  integrated_with UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  integration_url TEXT,
  description     TEXT,
  is_native       BOOLEAN NOT NULL DEFAULT FALSE,   -- true = built-in, false = via API/Zapier
  is_bidirectional BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (software_id, integrated_with),
  CONSTRAINT integrations_no_self_loop CHECK (software_id <> integrated_with)
);

COMMENT ON TABLE public.software_integrations IS 'Integration relationships between software products.';

CREATE TRIGGER trg_software_integrations_updated_at
  BEFORE UPDATE ON public.software_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4.3 collections (curated lists)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  item_count      INTEGER NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meta_title      TEXT,
  meta_description TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT collections_slug_format CHECK (slug ~ '^[a-z0-9\-]+$')
);

COMMENT ON TABLE public.collections IS 'Curated lists of software (e.g. "Best Free Jira Alternatives").';

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4.4 collection_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  software_id   UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, software_id)
);

COMMENT ON TABLE public.collection_items IS 'Items (software) belonging to a collection.';

-- =============================================================================
-- SECTION 5: OPERATIONS & TRACKING
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 slug_history (301 redirect support)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slug_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug    TEXT NOT NULL,
  new_slug    TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('software','category','collection')),
  entity_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (old_slug, entity_type)
);

COMMENT ON TABLE public.slug_history IS 'Tracks slug changes to enable 301 permanent redirects.';

-- ---------------------------------------------------------------------------
-- 5.2 redirects (manual / import redirects)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.redirects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path     TEXT NOT NULL UNIQUE,
  to_path       TEXT NOT NULL,
  status_code   SMALLINT NOT NULL DEFAULT 301 CHECK (status_code IN (301,302,307,308)),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  hit_count     BIGINT NOT NULL DEFAULT 0,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.redirects IS 'Manual URL redirects (imported / editorial).';

CREATE TRIGGER trg_redirects_updated_at
  BEFORE UPDATE ON public.redirects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5.3 search_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query           TEXT NOT NULL,
  normalized_query TEXT,
  synonyms_used   TEXT[],
  result_count    INTEGER,
  top_result_id   UUID REFERENCES public.softwares(id) ON DELETE SET NULL,
  latency_ms      INTEGER,
  session_id      TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  locale          CHAR(5) NOT NULL DEFAULT 'en',
  ip_hash         TEXT,                              -- anonymized
  user_agent      TEXT,
  clicked_result_id UUID REFERENCES public.softwares(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.search_logs IS 'Search query analytics for ranking refinement and UX improvement.';

-- ---------------------------------------------------------------------------
-- 5.4 feature_flags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  value       JSONB NOT NULL DEFAULT 'false',
  description TEXT,
  rollout_pct SMALLINT DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feature_flags IS 'Runtime feature flag store (edge-compatible via Supabase).';

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5.5 audit_logs
-- ---------------------------------------------------------------------------
-- NOTE: BIGSERIAL cannot be used inline with a composite PK on partitioned tables.
-- We declare the sequence manually and reference it so PRIMARY KEY(id, created_at) works.
CREATE SEQUENCE IF NOT EXISTS public.audit_logs_id_seq;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          BIGINT NOT NULL DEFAULT nextval('public.audit_logs_id_seq'),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,                         -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Partition key (created_at) MUST be part of the PK on partitioned tables.
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Own the sequence so it is dropped with the table
ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;

-- Create monthly partitions (extend as needed via cron)
CREATE TABLE public.audit_logs_2025_01 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE public.audit_logs_2025_q2 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE public.audit_logs_2025_q3 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE public.audit_logs_2025_q4 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE public.audit_logs_2026_q1 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE public.audit_logs_2026_q2 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE public.audit_logs_2026_q3 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE public.audit_logs_2026_q4 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

COMMENT ON TABLE public.audit_logs IS 'Partitioned audit trail for all CUD operations.';

-- ---------------------------------------------------------------------------
-- 5.6 translation_status
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.translation_status (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('software','category','collection','faq')),
  entity_id   UUID NOT NULL,
  locale      CHAR(5) NOT NULL,
  field_name  TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('pending','in_progress','completed','needs_review')),
  translator  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, locale, field_name)
);

COMMENT ON TABLE public.translation_status IS 'Tracks i18n translation progress per entity, locale, and field.';

CREATE TRIGGER trg_translation_status_updated_at
  BEFORE UPDATE ON public.translation_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 6: DATA INGESTION PIPELINE
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 6.1 import_sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  source_type     TEXT NOT NULL CHECK (source_type IN ('rss','api','scraper','manual','csv','partner')),
  endpoint_url    TEXT,
  auth_token      TEXT,                              -- encrypted at rest
  headers         JSONB,
  fetch_interval  INTEGER NOT NULL DEFAULT 3600,     -- seconds
  last_fetched_at TIMESTAMPTZ,
  next_fetch_at   TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  success_count   INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  config          JSONB,                             -- source-specific config
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.import_sources IS 'External data sources for automated software ingestion.';

CREATE TRIGGER trg_import_sources_updated_at
  BEFORE UPDATE ON public.import_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add FK from softwares now that import_sources exists
ALTER TABLE public.softwares
  ADD CONSTRAINT softwares_import_source_id_fkey
  FOREIGN KEY (import_source_id) REFERENCES public.import_sources(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 6.2 rss_sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rss_sources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_source_id  UUID NOT NULL REFERENCES public.import_sources(id) ON DELETE CASCADE,
  feed_url          TEXT NOT NULL UNIQUE,
  feed_type         TEXT NOT NULL DEFAULT 'rss' CHECK (feed_type IN ('rss','atom','json')),
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  language          CHAR(5) NOT NULL DEFAULT 'en',
  item_selector     TEXT,                            -- CSS / XPath for scraper fallback
  title_template    TEXT,                            -- Jinja-style template
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_etag         TEXT,
  last_modified     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.rss_sources IS 'RSS/Atom feed configurations for automated content ingestion.';

CREATE TRIGGER trg_rss_sources_updated_at
  BEFORE UPDATE ON public.rss_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6.3 change_logs (ingestion queue + diff history)
-- ---------------------------------------------------------------------------
CREATE TYPE public.change_log_status AS ENUM (
  'queued',
  'processing',
  'applied',
  'skipped',
  'failed',
  'duplicate'
);

CREATE TABLE IF NOT EXISTS public.change_logs (
  id              UUID NOT NULL DEFAULT gen_random_uuid(),
  software_id     UUID REFERENCES public.softwares(id) ON DELETE SET NULL,
  import_source_id UUID REFERENCES public.import_sources(id) ON DELETE SET NULL,
  rss_source_id   UUID REFERENCES public.rss_sources(id) ON DELETE SET NULL,

  -- Change data
  external_id     TEXT,                              -- ID from external source
  source_url      TEXT,
  raw_payload     JSONB NOT NULL,                    -- raw fetched data
  normalized_data JSONB,                             -- after normalization
  change_type     TEXT NOT NULL CHECK (change_type IN ('create','update','delete','enrich')),
  fields_changed  TEXT[],                            -- which fields differ
  diff            JSONB,                             -- before/after values

  -- Processing
  status          public.change_log_status NOT NULL DEFAULT 'queued',
  error_message   TEXT,
  retry_count     SMALLINT NOT NULL DEFAULT 0,
  processed_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at    TIMESTAMPTZ,
  priority        SMALLINT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Partition key (created_at) MUST be part of the PK on partitioned tables.
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Quarterly partitions for change_logs
CREATE TABLE public.change_logs_2025_q1 PARTITION OF public.change_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE public.change_logs_2025_q2 PARTITION OF public.change_logs
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE public.change_logs_2025_q3 PARTITION OF public.change_logs
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE public.change_logs_2025_q4 PARTITION OF public.change_logs
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE public.change_logs_2026_q1 PARTITION OF public.change_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE public.change_logs_2026_q2 PARTITION OF public.change_logs
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE public.change_logs_2026_q3 PARTITION OF public.change_logs
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE public.change_logs_2026_q4 PARTITION OF public.change_logs
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

COMMENT ON TABLE public.change_logs IS 'Partitioned ingestion queue and full diff history for software updates.';

CREATE TRIGGER trg_change_logs_updated_at
  BEFORE UPDATE ON public.change_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6.4 editorial_workflow
-- ---------------------------------------------------------------------------
CREATE TYPE public.editorial_status AS ENUM (
  'draft',
  'ready_for_review',
  'in_review',
  'approved',
  'published',
  'rejected',
  'archived'
);

CREATE TABLE IF NOT EXISTS public.editorial_workflow (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id     UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  status          public.editorial_status NOT NULL DEFAULT 'draft',
  assignee_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  rejection_reason TEXT,
  due_date        DATE,
  priority        SMALLINT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  version         INTEGER NOT NULL DEFAULT 1,
  approved_at     TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.editorial_workflow IS 'Draft→Review→Published editorial pipeline for software content.';

CREATE TRIGGER trg_editorial_workflow_updated_at
  BEFORE UPDATE ON public.editorial_workflow
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6.5 entity_deduplication
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entity_deduplication (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL DEFAULT 'software',
  source_id       UUID NOT NULL,                     -- potential duplicate
  canonical_id    UUID NOT NULL,                     -- the real record
  confidence      NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
  method          TEXT NOT NULL CHECK (method IN ('exact_name','fuzzy_name','url','embedding','manual')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, canonical_id, entity_type)
);

COMMENT ON TABLE public.entity_deduplication IS 'Tracks and resolves duplicate software entities from multiple sources.';

CREATE TRIGGER trg_entity_deduplication_updated_at
  BEFORE UPDATE ON public.entity_deduplication
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 7: AFFILIATE SYSTEM
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 affiliate_networks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_networks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  base_url        TEXT,
  tracking_param  TEXT NOT NULL DEFAULT 'ref',
  commission_type TEXT CHECK (commission_type IN ('cpa','cpl','cpc','revenue_share','hybrid')),
  default_commission NUMERIC(5,2),
  cookie_days     SMALLINT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.affiliate_networks IS 'Affiliate network configurations.';

CREATE TRIGGER trg_affiliate_networks_updated_at
  BEFORE UPDATE ON public.affiliate_networks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7.2 affiliate_links
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id     UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  network_id      UUID REFERENCES public.affiliate_networks(id) ON DELETE SET NULL,
  raw_url         TEXT NOT NULL,
  tracking_url    TEXT NOT NULL,
  label           TEXT,                              -- e.g. "Start Free Trial"
  commission_rate NUMERIC(5,2),
  link_type       TEXT NOT NULL DEFAULT 'primary' CHECK (link_type IN ('primary','trial','pricing','download')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  click_count     BIGINT NOT NULL DEFAULT 0,
  conversion_count BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.affiliate_links IS 'Tracked affiliate / referral links per software product.';

CREATE TRIGGER trg_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7.3 affiliate_clicks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id              BIGSERIAL,
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  session_id      TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer_url    TEXT,
  user_agent      TEXT,
  ip_hash         TEXT,
  locale          CHAR(5),
  converted       BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at    TIMESTAMPTZ,
  revenue         NUMERIC(10,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Quarterly partitions for affiliate_clicks
CREATE TABLE public.affiliate_clicks_2025_q1 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE public.affiliate_clicks_2025_q2 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE public.affiliate_clicks_2025_q3 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE public.affiliate_clicks_2025_q4 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE public.affiliate_clicks_2026_q1 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE public.affiliate_clicks_2026_q2 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE public.affiliate_clicks_2026_q3 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE public.affiliate_clicks_2026_q4 PARTITION OF public.affiliate_clicks
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

COMMENT ON TABLE public.affiliate_clicks IS 'Partitioned click tracking for all affiliate links.';

-- =============================================================================
-- SECTION 8: AI / SEARCH
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 software_embeddings (pgvector)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_embeddings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id     UUID NOT NULL UNIQUE REFERENCES public.softwares(id) ON DELETE CASCADE,
  model           TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  dimensions      SMALLINT NOT NULL DEFAULT 1536,
  embedding       VECTOR(1536),                      -- OpenAI text-embedding-3-small
  embedding_768   VECTOR(768),                       -- Google text-embedding-004 fallback
  input_text      TEXT,                              -- text that was embedded (for audit)
  token_count     INTEGER,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.software_embeddings IS 'pgvector embeddings for semantic/hybrid search.';

CREATE TRIGGER trg_software_embeddings_updated_at
  BEFORE UPDATE ON public.software_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 9: i18n CONTENT TRANSLATIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 software_translations (i18n fields per locale)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.software_translations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id         UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  locale              CHAR(5) NOT NULL,
  name                TEXT,
  tagline             TEXT,
  description         TEXT,
  short_description   TEXT,
  meta_title          TEXT,
  meta_description    TEXT,
  geo_summary         TEXT,
  is_machine_translated BOOLEAN NOT NULL DEFAULT TRUE,
  translated_at       TIMESTAMPTZ,
  reviewed_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (software_id, locale)
);

COMMENT ON TABLE public.software_translations IS 'Multilingual content for software (next-intl / i18n support).';

CREATE TRIGGER trg_software_translations_updated_at
  BEFORE UPDATE ON public.software_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9.2 category_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.category_translations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  locale          CHAR(5) NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, locale)
);

COMMENT ON TABLE public.category_translations IS 'Multilingual category names and descriptions.';

CREATE TRIGGER trg_category_translations_updated_at
  BEFORE UPDATE ON public.category_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
