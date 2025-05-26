import { useCurrency } from '../context/CurrencyContext';

export function getSelectedCurrency(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('selectedCurrency') || 'USD';
  }
  return 'USD';
}

export function formatCurrency(value: number): string {
  const currency = getSelectedCurrency();
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function useFormatCurrency() {
  const { currency } = useCurrency();
  return (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
}

// Utility to get currency symbol from code
export function getCurrencySymbol(currencyCode: string): string {
  try {
    // Use Intl.NumberFormat to extract the symbol
    return (0).toLocaleString('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d|\.|,|\s/g, '').trim();
  } catch {
    return '$'; // fallback
  }
}

// React hook to get current symbol from context
export function useCurrencySymbol() {
  const { currency } = useCurrency();
  return getCurrencySymbol(currency || 'USD');
} 