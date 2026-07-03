
REVOKE EXECUTE ON FUNCTION public.sales_compute_fee() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sales_update_wallet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_withdrawal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.withdrawal_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_wallet(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_matured_sales() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_matured_sales() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
