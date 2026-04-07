
CREATE TABLE public.restock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(part_number, email)
);

ALTER TABLE public.restock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to restock notifications"
  ON public.restock_notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own notifications by email"
  ON public.restock_notifications FOR SELECT
  TO anon, authenticated
  USING (true);
