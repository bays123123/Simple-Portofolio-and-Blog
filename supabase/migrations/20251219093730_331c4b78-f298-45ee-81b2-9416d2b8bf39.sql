-- Drop existing policy and recreate with explicit authenticated-only access
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create policy that explicitly requires authenticated users only
CREATE POLICY "Authenticated users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());