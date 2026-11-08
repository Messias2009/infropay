-- A buyer can accept only one post-purchase offer from the same main sale.
CREATE UNIQUE INDEX IF NOT EXISTS sales_parent_offer_once_unique
  ON public.sales(parent_sale_id)
  WHERE parent_sale_id IS NOT NULL;
