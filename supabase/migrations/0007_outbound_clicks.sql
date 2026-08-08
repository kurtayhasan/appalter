-- =============================================================================
-- Migration: Outbound Clicks
-- Creates a table to track clicks on "Visit Website" buttons for analytics.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.outbound_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID NOT NULL REFERENCES public.softwares(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert
CREATE POLICY "Allow public insert to outbound_clicks"
ON public.outbound_clicks FOR INSERT
WITH CHECK (true);

-- Allow public read
CREATE POLICY "Allow public read of outbound_clicks"
ON public.outbound_clicks FOR SELECT
USING (true);

-- Index for faster aggregation by software
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_software_id
ON public.outbound_clicks(software_id);

COMMENT ON TABLE public.outbound_clicks IS 'Tracks anonymous clicks on outbound links for affiliate performance analysis.';
