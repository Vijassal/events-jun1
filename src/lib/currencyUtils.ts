/**
 * Fetches the conversion rate between two currencies.
 * @param from - The source currency code (e.g., 'USD')
 * @param to - The target currency code (e.g., 'EUR')
 * @param supabase - The Supabase client instance
 * @returns The conversion rate as a number, 1 if rate not found
 */
export const fetchConversionRate = async (
  from: string,
  to: string,
  supabase: any
): Promise<number> => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let rate = 1; // Initialize to 1 instead of 0
  if (from === to) {
    rate = 1; // Same currency always has rate of 1
  } else {
    // Only try to get from Supabase, no API calls or updates
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .eq('date', today)
      .single();
    if (data && data.rate) {
      rate = data.rate;
    }
    // If rate not found, return 1 as fallback (rate is already 1)
  }
  return rate;
}; 