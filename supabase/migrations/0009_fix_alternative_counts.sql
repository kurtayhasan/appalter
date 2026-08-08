-- =============================================================================
-- Migration: Fix Alternative Counts
-- Description:
-- 1. Updates recalculate_alternative_count to only count 'published' softwares.
-- 2. Recalculates alternative_count for all existing softwares.
-- =============================================================================

-- 1. Update the RPC
CREATE OR REPLACE FUNCTION public.recalculate_alternative_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update count for the source software
  UPDATE public.softwares
  SET alternative_count = (
    SELECT COUNT(*) 
    FROM public.alternatives a
    JOIN public.softwares alt ON alt.id = a.alternative_id
    WHERE a.software_id = COALESCE(NEW.software_id, OLD.software_id)
      AND a.is_approved = TRUE
      AND alt.status = 'published'
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.software_id, OLD.software_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Recalculate ALL current alternative counts
UPDATE public.softwares s
SET alternative_count = (
  SELECT COUNT(*) 
  FROM public.alternatives a
  JOIN public.softwares alt ON alt.id = a.alternative_id
  WHERE a.software_id = s.id
    AND a.is_approved = TRUE
    AND alt.status = 'published'
);
