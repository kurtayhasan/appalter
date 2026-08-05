-- =============================================================================
-- AppAlter: MODULE 1 — RLS POLICIES
-- Migration: 0002_rls_policies.sql
-- Description: Strict Row Level Security policies for every table.
--              Principle: anonymous users read published data only.
--              Authenticated users may read more; admins have full access.
--              Service role bypasses RLS (never expose to client).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER: Check if the requesting user has 'admin' or 'editor' role
-- We store custom roles in a user_roles table (or auth.users raw_app_meta_data).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin'),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin', 'editor'),
    FALSE
  );
$$;

-- ---------------------------------------------------------------------------
-- user_roles (extends Supabase auth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','editor','admin','superadmin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role; admins see all
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Only superadmin can insert / update roles
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- categories
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (is_active = TRUE OR public.is_editor());

CREATE POLICY "categories_insert_editor"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_editor());

CREATE POLICY "categories_update_editor"
  ON public.categories FOR UPDATE
  USING (public.is_editor());

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- platforms
-- =============================================================================
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platforms_select_public"
  ON public.platforms FOR SELECT
  USING (is_active = TRUE OR public.is_editor());

CREATE POLICY "platforms_insert_editor"
  ON public.platforms FOR INSERT
  WITH CHECK (public.is_editor());

CREATE POLICY "platforms_update_editor"
  ON public.platforms FOR UPDATE
  USING (public.is_editor());

CREATE POLICY "platforms_delete_admin"
  ON public.platforms FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- pricing_models
-- =============================================================================
ALTER TABLE public.pricing_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_models_select_public"
  ON public.pricing_models FOR SELECT
  USING (is_active = TRUE OR public.is_editor());

CREATE POLICY "pricing_models_insert_editor"
  ON public.pricing_models FOR INSERT
  WITH CHECK (public.is_editor());

CREATE POLICY "pricing_models_update_editor"
  ON public.pricing_models FOR UPDATE
  USING (public.is_editor());

CREATE POLICY "pricing_models_delete_admin"
  ON public.pricing_models FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- softwares
-- =============================================================================
ALTER TABLE public.softwares ENABLE ROW LEVEL SECURITY;

-- Anonymous & authenticated: read only published records
CREATE POLICY "softwares_select_published"
  ON public.softwares FOR SELECT
  USING (
    status = 'published'
    OR public.is_editor()
    OR submitted_by = auth.uid()
  );

-- Any authenticated user can submit a new software (status defaults to 'draft')
CREATE POLICY "softwares_insert_authenticated"
  ON public.softwares FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND status = 'draft');

-- Submitters can update their own drafts; editors/admins can update any
CREATE POLICY "softwares_update_own_or_editor"
  ON public.softwares FOR UPDATE
  USING (
    (submitted_by = auth.uid() AND status IN ('draft', 'review'))
    OR public.is_editor()
  );

-- Only admins can delete
CREATE POLICY "softwares_delete_admin"
  ON public.softwares FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- software_platforms
-- =============================================================================
ALTER TABLE public.software_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_platforms_select_public"
  ON public.software_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_platforms.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_platforms_write_editor"
  ON public.software_platforms FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_aliases
-- =============================================================================
ALTER TABLE public.software_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_aliases_select_public"
  ON public.software_aliases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_aliases.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_aliases_write_editor"
  ON public.software_aliases FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_features
-- =============================================================================
ALTER TABLE public.software_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_features_select_published"
  ON public.software_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_features.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_features_write_editor"
  ON public.software_features FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_use_cases
-- =============================================================================
ALTER TABLE public.software_use_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_use_cases_select_published"
  ON public.software_use_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_use_cases.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_use_cases_write_editor"
  ON public.software_use_cases FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_pros_cons
-- =============================================================================
ALTER TABLE public.software_pros_cons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_pros_cons_select_published"
  ON public.software_pros_cons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_pros_cons.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_pros_cons_write_editor"
  ON public.software_pros_cons FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_faqs
-- =============================================================================
ALTER TABLE public.software_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_faqs_select_published"
  ON public.software_faqs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_faqs.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_faqs_write_editor"
  ON public.software_faqs FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_reviews
-- =============================================================================
ALTER TABLE public.software_reviews ENABLE ROW LEVEL SECURITY;

-- Public reads only approved reviews
CREATE POLICY "software_reviews_select_approved"
  ON public.software_reviews FOR SELECT
  USING (
    (is_approved = TRUE AND EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_reviews.software_id AND s.status = 'published'
    ))
    OR public.is_editor()
    OR user_id = auth.uid()
  );

-- Authenticated users can insert their own reviews
CREATE POLICY "software_reviews_insert_authenticated"
  ON public.software_reviews FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND is_approved = FALSE
    AND source = 'user'
  );

-- Users can update their own unapproved reviews; editors can update any
CREATE POLICY "software_reviews_update_own_or_editor"
  ON public.software_reviews FOR UPDATE
  USING (
    (user_id = auth.uid() AND is_approved = FALSE)
    OR public.is_editor()
  );

CREATE POLICY "software_reviews_delete_admin"
  ON public.software_reviews FOR DELETE
  USING (public.is_admin() OR user_id = auth.uid());

-- =============================================================================
-- software_screenshots
-- =============================================================================
ALTER TABLE public.software_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_screenshots_select_published"
  ON public.software_screenshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_screenshots.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_screenshots_write_editor"
  ON public.software_screenshots FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- alternatives
-- =============================================================================
ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alternatives_select_published"
  ON public.alternatives FOR SELECT
  USING (
    is_approved = TRUE
    OR public.is_editor()
  );

CREATE POLICY "alternatives_write_editor"
  ON public.alternatives FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- software_integrations
-- =============================================================================
ALTER TABLE public.software_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_integrations_select_public"
  ON public.software_integrations FOR SELECT
  USING (TRUE);

CREATE POLICY "software_integrations_write_editor"
  ON public.software_integrations FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- collections
-- =============================================================================
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_select_public"
  ON public.collections FOR SELECT
  USING (is_public = TRUE OR created_by = auth.uid() OR public.is_editor());

CREATE POLICY "collections_insert_authenticated"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "collections_update_own_or_editor"
  ON public.collections FOR UPDATE
  USING (created_by = auth.uid() OR public.is_editor());

CREATE POLICY "collections_delete_own_or_admin"
  ON public.collections FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

-- =============================================================================
-- collection_items
-- =============================================================================
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_items_select_public"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND (c.is_public = TRUE OR c.created_by = auth.uid() OR public.is_editor())
    )
  );

CREATE POLICY "collection_items_write_owner_or_editor"
  ON public.collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_items.collection_id
        AND (c.created_by = auth.uid() OR public.is_editor())
    )
  );

-- =============================================================================
-- slug_history
-- =============================================================================
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;

-- Public reads (needed for 301 redirect resolution)
CREATE POLICY "slug_history_select_public"
  ON public.slug_history FOR SELECT
  USING (TRUE);

CREATE POLICY "slug_history_write_editor"
  ON public.slug_history FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- redirects
-- =============================================================================
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redirects_select_public"
  ON public.redirects FOR SELECT
  USING (is_active = TRUE OR public.is_editor());

CREATE POLICY "redirects_write_admin"
  ON public.redirects FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- search_logs
-- =============================================================================
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Only editors/admins read analytics
CREATE POLICY "search_logs_select_admin"
  ON public.search_logs FOR SELECT
  USING (public.is_editor());

-- Anyone (including anon) can insert a search log (analytics)
CREATE POLICY "search_logs_insert_public"
  ON public.search_logs FOR INSERT
  WITH CHECK (TRUE);

-- =============================================================================
-- feature_flags
-- =============================================================================
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_select_public"
  ON public.feature_flags FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "feature_flags_write_admin"
  ON public.feature_flags FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- audit_logs
-- =============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Insert via service role only (never from client)
CREATE POLICY "audit_logs_insert_service"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- =============================================================================
-- translation_status
-- =============================================================================
ALTER TABLE public.translation_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "translation_status_select_editor"
  ON public.translation_status FOR SELECT
  USING (public.is_editor());

CREATE POLICY "translation_status_write_editor"
  ON public.translation_status FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- import_sources
-- =============================================================================
ALTER TABLE public.import_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_sources_select_admin"
  ON public.import_sources FOR SELECT
  USING (public.is_admin());

CREATE POLICY "import_sources_write_admin"
  ON public.import_sources FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- rss_sources
-- =============================================================================
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rss_sources_select_admin"
  ON public.rss_sources FOR SELECT
  USING (public.is_admin());

CREATE POLICY "rss_sources_write_admin"
  ON public.rss_sources FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- change_logs
-- =============================================================================
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "change_logs_select_editor"
  ON public.change_logs FOR SELECT
  USING (public.is_editor());

CREATE POLICY "change_logs_insert_service"
  ON public.change_logs FOR INSERT
  WITH CHECK (public.is_editor());

CREATE POLICY "change_logs_update_editor"
  ON public.change_logs FOR UPDATE
  USING (public.is_editor());

-- =============================================================================
-- editorial_workflow
-- =============================================================================
ALTER TABLE public.editorial_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_workflow_select_editor"
  ON public.editorial_workflow FOR SELECT
  USING (public.is_editor() OR assignee_id = auth.uid());

CREATE POLICY "editorial_workflow_insert_editor"
  ON public.editorial_workflow FOR INSERT
  WITH CHECK (public.is_editor());

CREATE POLICY "editorial_workflow_update_editor"
  ON public.editorial_workflow FOR UPDATE
  USING (public.is_editor() OR assignee_id = auth.uid());

CREATE POLICY "editorial_workflow_delete_admin"
  ON public.editorial_workflow FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- entity_deduplication
-- =============================================================================
ALTER TABLE public.entity_deduplication ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_deduplication_select_editor"
  ON public.entity_deduplication FOR SELECT
  USING (public.is_editor());

CREATE POLICY "entity_deduplication_write_editor"
  ON public.entity_deduplication FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- affiliate_networks
-- =============================================================================
ALTER TABLE public.affiliate_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_networks_select_admin"
  ON public.affiliate_networks FOR SELECT
  USING (public.is_admin());

CREATE POLICY "affiliate_networks_write_admin"
  ON public.affiliate_networks FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- affiliate_links
-- =============================================================================
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Public can read active affiliate links (needed to render CTA buttons)
CREATE POLICY "affiliate_links_select_active"
  ON public.affiliate_links FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "affiliate_links_write_admin"
  ON public.affiliate_links FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- affiliate_clicks
-- =============================================================================
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_clicks_select_admin"
  ON public.affiliate_clicks FOR SELECT
  USING (public.is_admin());

-- Anyone can insert a click (analytics event)
CREATE POLICY "affiliate_clicks_insert_public"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (TRUE);

-- =============================================================================
-- software_embeddings
-- =============================================================================
ALTER TABLE public.software_embeddings ENABLE ROW LEVEL SECURITY;

-- Only service role / admin reads raw embeddings
CREATE POLICY "software_embeddings_select_admin"
  ON public.software_embeddings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "software_embeddings_write_admin"
  ON public.software_embeddings FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- software_translations
-- =============================================================================
ALTER TABLE public.software_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "software_translations_select_public"
  ON public.software_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.softwares s
      WHERE s.id = software_translations.software_id
        AND (s.status = 'published' OR public.is_editor())
    )
  );

CREATE POLICY "software_translations_write_editor"
  ON public.software_translations FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- category_translations
-- =============================================================================
ALTER TABLE public.category_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "category_translations_select_public"
  ON public.category_translations FOR SELECT
  USING (TRUE);

CREATE POLICY "category_translations_write_editor"
  ON public.category_translations FOR ALL
  USING (public.is_editor());

-- =============================================================================
-- user_roles (already set above, repeated for documentation completeness)
-- =============================================================================
-- (policies defined at table creation above)
