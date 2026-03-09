-- Create inventory table for warehouse stock
CREATE TABLE public.inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number text NOT NULL,
    manufacturer text,
    description text,
    quantity integer NOT NULL DEFAULT 0,
    price numeric(12,2),
    currency text DEFAULT 'RUB',
    location text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create index for fast part number lookups
CREATE INDEX idx_inventory_part_number ON public.inventory(part_number);
CREATE INDEX idx_inventory_manufacturer ON public.inventory(manufacturer);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Anyone can view inventory (public catalog)
CREATE POLICY "Anyone can view inventory"
ON public.inventory FOR SELECT
TO authenticated, anon
USING (true);

-- Only authenticated users can manage inventory
CREATE POLICY "Authenticated users can insert inventory"
ON public.inventory FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
ON public.inventory FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete inventory"
ON public.inventory FOR DELETE
TO authenticated
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();