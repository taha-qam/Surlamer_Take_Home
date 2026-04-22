/**
 * services/market.ts
 * Domain-level service wrapping the raw Massive API client.
 *
 * Responsibilities:
 *  - Translate low-level ApiErrors into user-friendly messages
 *  - Centralise retry / back-off decisions (TanStack Query handles retries;
 *    this layer decides which errors are retryable)
 *  - Provide helper utilities (snapshot maps, price extraction) so components
 *    never touch raw API shapes directly
 */

import {
  getAggregates,
  getGainersLosers,
  getMarketNews,
  getMarketStatus,
  getSingleSnapshot,
  getSnapshots,
  getTickerDetails,
  getTickerNews,
  searchTickers,
} from '../api/massive';
import type { AggBar, NewsItem, TickerInfo, TickerSnapshot } from '../api/massive';

// Re-export types so the rest of the app imports from one place
export type { AggBar, NewsItem, TickerInfo, TickerSnapshot };
export { POPULAR_TICKERS } from '../api/massive';

// ─── Error helpers ────────────────────────────────────────────────────────────

function getErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const maybeStatus = (err as { status?: unknown }).status;
  if (typeof maybeStatus === 'number') return maybeStatus;

  const maybeMessage = (err as { message?: unknown }).message;
  if (typeof maybeMessage !== 'string') return undefined;

  const match = maybeMessage.match(/API error (\d{3})/);
  return match ? Number(match[1]) : undefined;
}

export function isRetryable(err: unknown): boolean {
  const status = getErrorStatus(err);
  if (status !== undefined) return status >= 500 || status === 429;
  return true; // network errors are always retryable
}

export function friendlyError(err: unknown): string {
  const status = getErrorStatus(err);
  if (status === 403) return 'API key is invalid or missing.';
  if (status === 404) return 'This ticker could not be found.';
  if (status === 429) return 'Rate limit reached — please wait a moment.';
  if (status !== undefined && status >= 500) return 'Market data service is temporarily unavailable.';
  if (err instanceof TypeError) return 'Network error — check your connection.';
  return 'An unexpected error occurred.';
}

// ─── Snapshot utilities ───────────────────────────────────────────────────────

/** Returns close → last trade → previous close, whichever is available first. */
export function extractPrice(s: TickerSnapshot): number | undefined {
  return s.day?.c || s.lastTrade?.p || s.prevDay?.c || undefined;
}

/** Index an array of snapshots by ticker for O(1) lookups. */
export function indexSnapshots(
  snapshots: TickerSnapshot[],
): Record<string, TickerSnapshot> {
  const map: Record<string, TickerSnapshot> = {};
  for (const s of snapshots) map[s.ticker] = s;
  return map;
}

// ─── Market service (thin wrappers that add error context) ────────────────────

export async function fetchSnapshots(tickers: string[]): Promise<TickerSnapshot[]> {
  try {
    return await getSnapshots(tickers);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchSingleSnapshot(
  ticker: string,
): Promise<TickerSnapshot | null> {
  try {
    return await getSingleSnapshot(ticker);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchTickerDetails(
  ticker: string,
): Promise<TickerInfo | null> {
  try {
    return await getTickerDetails(ticker);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchAggregates(
  ticker: string,
  from: string,
  to: string,
  timespan = 'day',
): Promise<AggBar[]> {
  try {
    return await getAggregates(ticker, from, to, timespan);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchTickerSearch(
  query: string,
  limit = 20,
): Promise<TickerInfo[]> {
  try {
    return await searchTickers(query, limit);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchGainersLosers(
  direction: 'gainers' | 'losers',
): Promise<TickerSnapshot[]> {
  try {
    return await getGainersLosers(direction);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchMarketStatus() {
  try {
    return await getMarketStatus();
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchTickerNews(
  ticker: string,
  limit = 5,
): Promise<NewsItem[]> {
  try {
    return await getTickerNews(ticker, limit);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function fetchMarketNews(limit = 6): Promise<NewsItem[]> {
  try {
    return await getMarketNews(limit);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}
