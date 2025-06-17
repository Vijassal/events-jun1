// @ts-ignore
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
// @ts-ignore
const fetch = require('node-fetch');
import { supabase } from '../src/lib/supabase';

const topCurrencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD',
  'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
  'TWD', 'DKK', 'PLN', 'THB', 'IDR'
];

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const apiVersion = 'v1';

async function fetchRates(base: string): Promise<Record<string, number> | null> {
  const endpoint = `currencies/${base.toLowerCase()}.json`;
  const primaryUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/${apiVersion}/${endpoint}`;
  const fallbackUrl = `https://latest.currency-api.pages.dev/${apiVersion}/${endpoint}`;
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error('Primary API failed');
    const data = await res.json();
    return data[base.toLowerCase()];
  } catch (e) {
    console.warn(`[${base}] Primary API failed, trying fallback...`);
    try {
      const res = await fetch(fallbackUrl);
      if (!res.ok) throw new Error('Fallback API failed');
      const data = await res.json();
      return data[base.toLowerCase()];
    } catch (err) {
      console.error(`[${base}] Both APIs failed.`);
      return null;
    }
  }
}

async function updateAllRates() {
  // Delete all rates from the table
  const { error: delError } = await supabase.from('exchange_rates').delete().neq('from_currency', '');
  if (delError) {
    console.error('Error deleting all rates:', delError.message);
  } else {
    console.log('Deleted all rates from the table.');
  }

  for (const base of topCurrencies) {
    console.log(`Fetching rates for base: ${base}`);
    const rates = await fetchRates(base);
    if (!rates) continue;
    const upserts = Object.entries(rates)
      .filter(([to]) => topCurrencies.includes(to.toUpperCase()) && to.toUpperCase() !== base)
      .map(([to, rate]) => ({
        from_currency: base,
        to_currency: to.toUpperCase(),
        rate: Number(rate),
        date: today,
      }));
    if (upserts.length === 0) continue;
    const { error } = await supabase.from('exchange_rates').insert(upserts);
    if (error) {
      console.error(`[${base}] Supabase insert error:`, error.message);
    } else {
      console.log(`[${base}] Inserted ${upserts.length} rates.`);
    }
  }
  console.log('Exchange rates update complete.');
  // Write timestamp file on success
  const fs = require('fs');
  const path = require('path');
  const tsPath = path.resolve(require('os').homedir(), 'last_exchange_update.txt');
  fs.writeFileSync(tsPath, new Date().toISOString(), 'utf8');
}

updateAllRates().catch(e => {
  console.error('Fatal error updating exchange rates:', e);
  process.exit(1);
}); 