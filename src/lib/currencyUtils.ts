/**
 * Fetches the conversion rate between two currencies.
 * @param from - The source currency code (e.g., 'USD')
 * @param to - The target currency code (e.g., 'EUR')
 * @param supabase - The Supabase client instance
 * @returns The conversion rate as a number
 */
export const fetchConversionRate = async (
  from: string,
  to: string,
  supabase: any
): Promise<number> => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let rate = 1;
  if (from === to) {
    rate = 1;
  } else {
    // 1. Try to get from Supabase
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .eq('date', today)
      .single();
    if (data && data.rate) {
      rate = data.rate;
    } else {
      // 2. Fetch from API
      try {
        const res = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}`);
        const apiData = await res.json();
        if (apiData && apiData.info && apiData.info.rate) {
          rate = apiData.info.rate;
        } else if (apiData && apiData.result) {
          rate = apiData.result;
        }
        // 3. Upsert into Supabase (update if exists, insert if not)
        await supabase.from('exchange_rates').upsert([
          { from_currency: from, to_currency: to, rate, date: today }
        ], { onConflict: 'from_currency,to_currency,date' });
      } catch (e) {
        rate = 1;
      }
    }
  }
  return rate;
}; 