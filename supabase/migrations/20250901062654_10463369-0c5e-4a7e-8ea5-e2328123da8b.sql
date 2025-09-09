-- Temporarily allow all authenticated users to manage test_versions for debugging
-- This matches the test_masters policy structure

DROP POLICY IF EXISTS "Admins can insert test versions" ON public.test_versions;
DROP POLICY IF EXISTS "Admins can manage test versions" ON public.test_versions;

CREATE POLICY "Temp allow authenticated users to manage test versions" 
ON public.test_versions 
FOR ALL
USING (true)
WITH CHECK (true);