
-- Catalog products table for admin-uploaded products
CREATE TABLE public.catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text NOT NULL,
  manufacturer text,
  category text,
  subcategory text,
  description text,
  package text,
  quantity integer NOT NULL DEFAULT 0,
  price numeric,
  currency text DEFAULT 'RUB',
  image_url text,
  datasheet_url text,
  is_new boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

-- Anyone can read catalog products
CREATE POLICY "Public can view catalog products"
  ON public.catalog_products FOR SELECT
  TO public
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert catalog products"
  ON public.catalog_products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update catalog products"
  ON public.catalog_products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete catalog products"
  ON public.catalog_products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_catalog_products_updated_at
  BEFORE UPDATE ON public.catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
