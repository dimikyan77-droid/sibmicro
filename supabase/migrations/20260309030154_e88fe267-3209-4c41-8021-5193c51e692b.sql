
-- Add user_id (nullable, so anonymous quotes still work) and status to quote_requests
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Allow authenticated users to view their own quote requests
CREATE POLICY "Users can view own quote requests"
  ON public.quote_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
