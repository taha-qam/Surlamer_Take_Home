// Set up API Key and base URL from environment variables
const API_KEY = import.meta.env.VITE_MASSIVE_API_KEY as string;
const BASE = 'https://api.massive.com';

// ─── Domain error type ────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface TickerInfo {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  description?: string;
  market_cap?: number;
  employees?: number;
  homepage_url?: string;
  sic_description?: string;
  total_employees?: number;
  list_date?: string;
  share_class_shares_outstanding?: number;
}

export interface TickerSnapshot {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  day: { o: number; h: number; l: number; c: number; v: number; vw: number };
  min: { o: number; h: number; l: number; c: number; v: number; vw: number; av: number };
  prevDay: { o: number; h: number; l: number; c: number; v: number; vw: number };
  lastTrade: { c: string[]; i: string; p: number; s: number; t: number; x: number };
  lastQuote: { P: number; S: number; p: number; s: number; t: number };
}

export interface AggBar {
  c: number; h: number; l: number; o: number; t: number; v: number; vw: number; n: number;
}

export interface NewsItem {
  id: string;
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  image_url?: string;
  description: string;
  tickers: string[];
  publisher: {
    name: string;
    homepage_url: string;
    logo_url?: string;
    favicon_url?: string;
  };
}

export interface MarketStatus {
  market: string;
  serverTime: string;
  exchanges: Record<string, string>;
}

// HTTP client 

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('apiKey', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, `Massive API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// Public API functions 

export async function searchTickers(query: string, limit = 20): Promise<TickerInfo[]> {
  const data = await get<{ results?: TickerInfo[] }>('/v3/reference/tickers', {
    search: query,
    market: 'stocks',
    active: 'true',
    limit: String(limit),
    sort: 'ticker',
  });
  return data.results ?? [];
}

export async function getTickerDetails(ticker: string): Promise<TickerInfo | null> {
  try {
    const data = await get<{ results?: TickerInfo }>(`/v3/reference/tickers/${ticker}`);
    return data.results ?? null;
  } catch {
    return null;
  }
}

export async function getSnapshots(tickers: string[]): Promise<TickerSnapshot[]> {
  if (!tickers.length) return [];
  const data = await get<{ tickers?: TickerSnapshot[] }>(
    '/v2/snapshot/locale/us/markets/stocks/tickers',
    { tickers: tickers.join(',') },
  );
  return data.tickers ?? [];
}

export async function getSingleSnapshot(ticker: string): Promise<TickerSnapshot | null> {
  try {
    const data = await get<{ ticker?: TickerSnapshot }>(
      `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`,
    );
    return data.ticker ?? null;
  } catch {
    return null;
  }
}

export async function getAggregates(
  ticker: string,
  from: string,
  to: string,
  timespan = 'day',
): Promise<AggBar[]> {
  const data = await get<{ results?: AggBar[] }>(
    `/v2/aggs/ticker/${ticker}/range/1/${timespan}/${from}/${to}`,
    { adjusted: 'true', sort: 'asc', limit: '120' },
  );
  return data.results ?? [];
}

export async function getGainersLosers(
  direction: 'gainers' | 'losers',
): Promise<TickerSnapshot[]> {
  const data = await get<{ tickers?: TickerSnapshot[] }>(
    `/v2/snapshot/locale/us/markets/stocks/${direction}`,
  );
  return data.tickers ?? [];
}

export async function getMarketStatus(): Promise<MarketStatus> {
  return get<MarketStatus>('/v1/marketstatus/now');
}

export async function getTickerNews(ticker: string, limit = 5): Promise<NewsItem[]> {
  const data = await get<{ results?: NewsItem[] }>('/v2/reference/news', {
    ticker,
    limit: String(limit),
    sort: 'published_utc',
    order: 'desc',
  });
  return data.results ?? [];
}

export async function getMarketNews(limit = 6): Promise<NewsItem[]> {
  const data = await get<{ results?: NewsItem[] }>('/v2/reference/news', {
    limit: String(limit),
    sort: 'published_utc',
    order: 'desc',
  });
  return data.results ?? [];
}

// Popular tickers for browse view
export const POPULAR_TICKERS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B',
  'JPM', 'V', 'UNH', 'XOM', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'CVX',
  'MRK', 'LLY', 'ABBV', 'PEP', 'KO', 'AVGO', 'COST', 'MCD', 'NFLX',
  'AMD', 'INTC', 'QCOM', 'DIS', 'BA', 'GS', 'MS', 'BAC', 'WFC', 'C',
  'CRM', 'ORCL', 'IBM', 'ADBE', 'NOW', 'SNOW', 'PLTR', 'UBER', 'LYFT',
];
