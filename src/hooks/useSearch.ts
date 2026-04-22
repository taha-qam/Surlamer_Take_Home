/**
 * hooks/useSearch.ts
 * Debounced ticker-search hook.  Returns results, a loading flag, and a
 * snapshot map keyed by ticker so search-result cards can render live prices.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchTickerSearch, fetchSnapshots, indexSnapshots } from '../services/market';
import type { TickerInfo, TickerSnapshot } from '../services/market';

interface UseSearchResult {
  results: TickerInfo[];
  snapshots: Record<string, TickerSnapshot>;
  isSearching: boolean;
  error: string | null;
}

export function useSearch(query: string, enabled = true): UseSearchResult {
  const [results, setResults] = useState<TickerInfo[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, TickerSnapshot>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setResults([]);
      setSnapshots({});
      setError(null);
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    setIsSearching(true);
    setError(null);

    timer.current = setTimeout(async () => {
      try {
        const found = await fetchTickerSearch(query, 20);
        setResults(found);

        // Fetch live snapshots for the first page of results
        if (found.length > 0) {
          const snaps = await fetchSnapshots(
            found.slice(0, 20).map((r) => r.ticker),
          );
          setSnapshots(indexSnapshots(snaps));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, enabled]);

  return { results, snapshots, isSearching, error };
}
