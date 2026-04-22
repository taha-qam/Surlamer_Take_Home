/**
 * store/workbench.ts
 * Global UI state for the Workbench, persisted to localStorage so research
 * survives page reloads.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortfolioEntry {
  ticker: string;
  name: string;
  notes: string;
  addedAt: string; // ISO timestamp
}

interface WorkbenchState {
  // Navigation
  activeTab: 'browse' | 'portfolio';
  selectedTicker: string | null;

  // Search
  searchQuery: string;

  // Portfolio
  portfolio: PortfolioEntry[];
}

interface WorkbenchActions {
  setActiveTab: (tab: 'browse' | 'portfolio') => void;
  setSelectedTicker: (ticker: string | null) => void;
  setSearchQuery: (q: string) => void;

  addToPortfolio: (ticker: string, name: string) => void;
  removeFromPortfolio: (ticker: string) => void;
  updateNotes: (ticker: string, notes: string) => void;
  isInPortfolio: (ticker: string) => boolean;
}

type WorkbenchStore = WorkbenchState & WorkbenchActions;

export const useStore = create<WorkbenchStore>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      activeTab: 'browse',
      selectedTicker: null,
      searchQuery: '',
      portfolio: [],

      // ── Navigation ────────────────────────────────────────────────────────
      setActiveTab: (tab) => set({ activeTab: tab, selectedTicker: null }),
      setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // ── Portfolio ─────────────────────────────────────────────────────────
      addToPortfolio: (ticker, name) => {
        const { portfolio } = get();
        if (portfolio.some((e) => e.ticker === ticker)) return;
        set({
          portfolio: [
            ...portfolio,
            { ticker, name, notes: '', addedAt: new Date().toISOString() },
          ],
        });
      },

      removeFromPortfolio: (ticker) =>
        set((s) => ({
          portfolio: s.portfolio.filter((e) => e.ticker !== ticker),
        })),

      updateNotes: (ticker, notes) =>
        set((s) => ({
          portfolio: s.portfolio.map((e) =>
            e.ticker === ticker ? { ...e, notes } : e,
          ),
        })),

      isInPortfolio: (ticker) =>
        get().portfolio.some((e) => e.ticker === ticker),
    }),
    {
      name: 'surlamer-workbench', // localStorage key
      // Only persist portfolio data; transient UI state resets on load
      partialize: (state) => ({ portfolio: state.portfolio }),
    },
  ),
);
