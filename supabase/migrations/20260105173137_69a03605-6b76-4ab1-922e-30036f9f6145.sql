-- Drop existing restrictive policies on settings
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Public can view public settings" ON public.settings;
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.settings;

-- Create new policies that work with the custom auth system
-- Allow authenticated users (via anon key with API) to manage settings
CREATE POLICY "Authenticated users can read settings"
ON public.settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can insert settings"
ON public.settings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
ON public.settings
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete settings"
ON public.settings
FOR DELETE
TO anon, authenticated
USING (true);