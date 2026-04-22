import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortfolioEntry {
  ticker: string;
  name: string;
  addedAt: number;
  notes: string;
}

interface WorkbenchState {
  portfolio: PortfolioEntry[];
  searchQuery: string;
  selectedTicker: string | null;
  activeTab: 'browse' | 'portfolio';
  addToPortfolio: (ticker: string, name: string) => void;
  removeFromPortfolio: (ticker: string) => void;
  isInPortfolio: (ticker: string) => boolean;
  updateNotes: (ticker: string, notes: string) => void;
  setSearchQuery: (q: string) => void;
  setSelectedTicker: (ticker: string | null) => void;
  setActiveTab: (tab: 'browse' | 'portfolio') => void;
}

export const useStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      portfolio: [],
      searchQuery: '',
      selectedTicker: null,
      activeTab: 'browse',

      addToPortfolio: (ticker, name) => {
        if (get().portfolio.find(e => e.ticker === ticker)) return;
        set(s => ({ portfolio: [...s.portfolio, { ticker, name, addedAt: Date.now(), notes: '' }] }));
      },
      removeFromPortfolio: (ticker) =>
        set(s => ({ portfolio: s.portfolio.filter(e => e.ticker !== ticker) })),
      isInPortfolio: (ticker) => !!get().portfolio.find(e => e.ticker === ticker),
      updateNotes: (ticker, notes) =>
        set(s => ({ portfolio: s.portfolio.map(e => e.ticker === ticker ? { ...e, notes } : e) })),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'surlamer-workbench',
      partialize: (state) => ({
        portfolio: state.portfolio,
        searchQuery: state.searchQuery,
        activeTab: state.activeTab,
      }),
    }
  )
);
