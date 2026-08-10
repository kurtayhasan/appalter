-- =============================================================================
-- Migration: Fix Category and Alternative Counts
-- Description:
-- 1. Create trigger for categories.software_count
-- 2. Recalculate alternative_count for all softwares
-- 3. Recalculate software_count for all categories
-- =============================================================================

-- 1. Trigger function for categories.software_count
CREATE OR REPLACE FUNCTION public.recalculate_category_software_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.category_id IS NOT NULL THEN
      UPDATE public.categories
      SET software_count = (
        SELECT COUNT(*)
        FROM public.softwares
        WHERE category_id = NEW.category_id
          AND status = 'published'
      ),
      updated_at = NOW()
      WHERE id = NEW.category_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category_id IS NOT NULL AND OLD.category_id != NEW.category_id) THEN
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

DROP TRIGGER IF EXISTS trigger_recalculate_category_software_count ON public.softwares;
CREATE TRIGGER trigger_recalculate_category_software_count
AFTER INSERT OR UPDATE OR DELETE ON public.softwares
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_category_software_count();


-- 2. Recalculate ALL current category software counts
UPDATE public.categories c
SET software_count = (
  SELECT COUNT(*)
  FROM public.softwares s
  WHERE s.category_id = c.id
    AND s.status = 'published'
);

-- 3. Recalculate ALL current alternative counts
UPDATE public.softwares s
SET alternative_count = (
  SELECT COUNT(*) 
  FROM public.alternatives a
  JOIN public.softwares alt ON alt.id = a.alternative_id
  WHERE a.software_id = s.id
    AND a.is_approved = TRUE
    AND alt.status = 'published'
);
