/**
 * hooks/useMarketData.ts
 * TanStack Query hooks for all market-data fetching.
 * Pages and components import from here — never from the service layer directly.
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchAggregates,
  fetchGainersLosers,
  fetchMarketNews,
  fetchMarketStatus,
  fetchSingleSnapshot,
  fetchSnapshots,
  fetchTickerDetails,
  fetchTickerNews,
  indexSnapshots,
  isRetryable,
} from '../services/market';
import type { AggBar, NewsItem, TickerSnapshot } from '../services/market';
import { subDays } from '../api/format';

// Shared retry policy using the service-layer helper
const retry = (failCount: number, err: unknown) =>
  failCount < 2 && isRetryable(err);

// ─── Browse / popular tickers ─────────────────────────────────────────────────

export function useBrowseSnapshots(tickers: string[], enabled = true) {
  return useQuery<TickerSnapshot[]>({
    queryKey: ['snapshots', 'browse', tickers.join(',')],
    queryFn: () => fetchSnapshots(tickers),
    staleTime: 2 * 60_000,
    retry,
    enabled,
  });
}

// ─── Portfolio snapshots ──────────────────────────────────────────────────────

export function usePortfolioSnapshots(tickers: string[]) {
  const query = useQuery<TickerSnapshot[]>({
    queryKey: ['snapshots', 'portfolio', tickers.join(',')],
    queryFn: () => fetchSnapshots(tickers),
    staleTime: 60_000,
    retry,
    enabled: tickers.length > 0,
  });

  const snapshotMap = indexSnapshots(query.data ?? []);
  return { ...query, snapshotMap };
}

// ─── Single ticker ────────────────────────────────────────────────────────────

export function useSingleSnapshot(ticker: string) {
  return useQuery<TickerSnapshot | null>({
    queryKey: ['snapshot', ticker],
    queryFn: () => fetchSingleSnapshot(ticker),
    staleTime: 60_000,
    retry,
  });
}

export function useTickerDetails(ticker: string) {
  return useQuery({
    queryKey: ['details', ticker],
    queryFn: () => fetchTickerDetails(ticker),
    staleTime: 10 * 60_000,
    retry,
  });
}

export function useAggregates(ticker: string, days = 90) {
  const today = new Date().toISOString().split('T')[0];
  const from = subDays(new Date(), days);
  return useQuery<AggBar[]>({
    queryKey: ['agg', ticker, `${days}d`],
    queryFn: () => fetchAggregates(ticker, from, today, 'day'),
    staleTime: 5 * 60_000,
    retry,
  });
}

// ─── News ─────────────────────────────────────────────────────────────────────

export function useTickerNews(ticker: string, limit = 4) {
  return useQuery<NewsItem[]>({
    queryKey: ['news', ticker, limit],
    queryFn: () => fetchTickerNews(ticker, limit),
    staleTime: 5 * 60_000,
    retry,
  });
}

export function useMarketNews(limit = 6) {
  return useQuery<NewsItem[]>({
    queryKey: ['market-news', limit],
    queryFn: () => fetchMarketNews(limit),
    staleTime: 5 * 60_000,
    retry,
  });
}

export function usePortfolioNews(tickers: string[], limit = 8) {
  // Fetch news for the first ticker; falls back to market-wide news
  const primaryTicker = tickers[0] ?? null;
  return useQuery<NewsItem[]>({
    queryKey: ['portfolio-news', primaryTicker, limit],
    queryFn: () =>
      primaryTicker
        ? fetchTickerNews(primaryTicker, limit)
        : fetchMarketNews(limit),
    staleTime: 5 * 60_000,
    retry,
    enabled: true,
  });
}

// ─── Market-level ─────────────────────────────────────────────────────────────

export function useGainersLosers(direction: 'gainers' | 'losers') {
  return useQuery({
    queryKey: [direction],
    queryFn: () => fetchGainersLosers(direction),
    staleTime: 2 * 60_000,
    retry,
  });
}

export function useMarketStatus() {
  return useQuery({
    queryKey: ['market-status'],
    queryFn: fetchMarketStatus,
    staleTime: 60_000,
    retry,
  });
}
