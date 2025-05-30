// @ts-nocheck
import { fetchConversionRate } from './currencyUtils';

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
  upsert: jest.fn(),
};

global.fetch = jest.fn();

describe('fetchConversionRate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 1 if from and to are the same', async () => {
    const rate = await fetchConversionRate('USD', 'USD', mockSupabase);
    expect(rate).toBe(1);
  });

  it('returns rate from supabase if available', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { rate: 1.23 }, error: null });
    const rate = await fetchConversionRate('USD', 'EUR', mockSupabase);
    expect(rate).toBe(1.23);
    expect(mockSupabase.from).toHaveBeenCalledWith('exchange_rates');
  });

  it('fetches from API and upserts if not in supabase', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ info: { rate: 1.5 } }),
    });
    mockSupabase.upsert.mockResolvedValueOnce({});
    const rate = await fetchConversionRate('USD', 'INR', mockSupabase);
    expect(rate).toBe(1.5);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('from=USD&to=INR'));
    expect(mockSupabase.upsert).toHaveBeenCalled();
  });

  it('falls back to 1 if API fails', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    mockSupabase.upsert.mockResolvedValueOnce({});
    const rate = await fetchConversionRate('USD', 'JPY', mockSupabase);
    expect(rate).toBe(1);
  });
}); 