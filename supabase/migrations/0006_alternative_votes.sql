-- =============================================================================
-- Migration: Alternative Votes
-- Adds upvotes column to alternatives and creates a tracking table for anonymous
-- voting with hashed IP addresses to comply with GDPR.
-- =============================================================================

-- Add upvotes column to alternatives table
ALTER TABLE public.alternatives
ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0;

-- Create table to track individual votes to prevent spam
CREATE TABLE IF NOT EXISTS public.alternative_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternative_record_id UUID NOT NULL REFERENCES public.alternatives(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent the same IP hash from voting twice on the same alternative relation
  UNIQUE (alternative_record_id, ip_hash)
);

-- Enable RLS
ALTER TABLE public.alternative_votes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read
CREATE POLICY "Allow public read of alternative_votes"
ON public.alternative_votes FOR SELECT
USING (true);

-- Allow anonymous insert
CREATE POLICY "Allow public insert to alternative_votes"
ON public.alternative_votes FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_alternative_votes_record_ip
ON public.alternative_votes(alternative_record_id, ip_hash);

-- Create RPC for atomic increment
CREATE OR REPLACE FUNCTION public.increment_alternative_upvotes(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.alternatives
  SET upvotes = upvotes + 1
  WHERE id = p_id;
END;
$$;

COMMENT ON TABLE public.alternative_votes IS 'Tracks anonymous upvotes on alternatives using hashed IPs for GDPR compliance and spam prevention.';
