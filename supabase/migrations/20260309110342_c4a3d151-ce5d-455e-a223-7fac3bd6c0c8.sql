-- Allow admins to SELECT all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all order status history
CREATE POLICY "Admins can view all order status history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));