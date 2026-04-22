/**
 * pages/WorkbenchPage.tsx
 * The main equity research workbench.
 * Semantic elements: <main>, <aside>, <nav>, <header>, <section>, <article>,
 * <table>, <dl>, <time>.  No spurious <div> wrappers.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Briefcase, LayoutGrid, ArrowLeft,
  ChevronDown, Trash2, FileText, RefreshCw,
} from 'lucide-react';
import { POPULAR_TICKERS } from '../services/market';
import { useBrowseSnapshots, usePortfolioSnapshots } from '../hooks/useMarketData';
import { useSearch } from '../hooks/useSearch';
import { extractPrice } from '../services/market';
import { fmtPrice, fmtPct, fmtChange, fmtVolume, changeColor, changeBg } from '../api/format';
import { useStore } from '../store/workbench';
import { TickerCard } from '../components/TickerCard';
import { TickerDetail } from '../components/TickerDetail';
import { MiniChart } from '../components/MiniChart';
import { PortfolioNewsPanel } from '../components/PortfolioNewsPanel';
import { ErrorBoundary } from '../error/ErrorBoundary';
import surlamerLogo from '../assets/surlamer-logo.svg';

const BROWSE_BATCH = POPULAR_TICKERS.slice(0, 24);

export function WorkbenchPage() {
  const navigate = useNavigate();
  const {
    portfolio, searchQuery, selectedTicker, activeTab,
    setSearchQuery, setSelectedTicker, setActiveTab,
    removeFromPortfolio, updateNotes,
  } = useStore();

  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const isSearchActive = activeTab === 'browse' && !!searchQuery.trim();

  const handleTabSwitch = (tab: 'browse' | 'portfolio') => {
    setActiveTab(tab);
    if (tab === 'portfolio') setSearchQuery('');
  };

  // Data hooks
  const {
    data: browseSnapshots,
    isLoading: browseLoading,
    refetch: refetchBrowse,
  } = useBrowseSnapshots(BROWSE_BATCH, activeTab === 'browse' && !isSearchActive);

  const portfolioTickers = portfolio.map((e) => e.ticker);
  const {
    isLoading: portfolioLoading,
    refetch: refetchPortfolio,
    snapshotMap: portfolioSnapshotMap,
  } = usePortfolioSnapshots(portfolioTickers);

  const { results: searchResults, snapshots: searchSnapshotMap, isSearching, error: searchError } = useSearch(
    searchQuery,
    isSearchActive,
  );

  // Derive name map from search results
  const nameMap: Record<string, string> = {};
  searchResults.forEach((r) => { nameMap[r.ticker] = r.name; });

  // Portfolio summary aggregates
  const portfolioValue = portfolioTickers.reduce((sum, ticker) => {
    const s = portfolioSnapshotMap[ticker];
    return sum + (s?.day?.c ?? s?.prevDay?.c ?? 0);
  }, 0);

  const portfolioChange = portfolioTickers.reduce((sum, ticker) => {
    const s = portfolioSnapshotMap[ticker];
    return sum + (s?.todaysChange ?? 0);
  }, 0);

  const handleNotesEdit = (ticker: string, currentNotes: string) => {
    setEditingNotes(ticker);
    setNotesValue(currentNotes);
  };

  const handleNotesSave = (ticker: string) => {
    updateNotes(ticker, notesValue);
    setEditingNotes(null);
  };

  return (
    <div style={shell}>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside style={sidebar} aria-label="Workbench sidebar">
        <header style={sideTop}>
          <button onClick={() => navigate('/')} style={backBtn}>
            <ArrowLeft size={14} aria-hidden /> Back
          </button>
          <a href="/" style={{ ...logoArea, textDecoration: 'none' }} aria-label="Surlamer Research home">
            <img src={surlamerLogo} alt="" aria-hidden style={logoMark} />
            <span>
              <span style={logoName}>Surlamer</span>
              <span style={logoLabel}>Equity Workbench</span>
            </span>
          </a>
        </header>

        <nav style={sideNav} aria-label="Workbench tabs">
          <button style={navItem(activeTab === 'browse')} onClick={() => handleTabSwitch('browse')} aria-current={activeTab === 'browse' ? 'page' : undefined}>
            <LayoutGrid size={15} aria-hidden />
            <span>Browse</span>
          </button>
          <button style={navItem(activeTab === 'portfolio')} onClick={() => handleTabSwitch('portfolio')} aria-current={activeTab === 'portfolio' ? 'page' : undefined}>
            <Briefcase size={15} aria-hidden />
            <span>Portfolio</span>
            {portfolio.length > 0 && (
              <span style={badge} aria-label={`${portfolio.length} holdings`}>{portfolio.length}</span>
            )}
          </button>
        </nav>

        {/* Mini portfolio preview — only on browse tab */}
        {portfolio.length > 0 && activeTab === 'browse' && (
          <section style={sidePortfolioCard} aria-label="Portfolio preview">
            <p style={sidePortfolioLabel}>Your Portfolio</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {portfolio.slice(0, 5).map((entry) => {
                const s = portfolioSnapshotMap[entry.ticker];
                const chg = s?.todaysChangePerc;
                return (
                  <li key={entry.ticker}>
                    <button style={sidePortfolioRow} onClick={() => setSelectedTicker(entry.ticker)}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>{entry.ticker}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: changeColor(chg) }}>{fmtPct(chg)}</span>
                    </button>
                  </li>
                );
              })}
              {portfolio.length > 5 && (
                <li style={{ fontSize: 11, color: 'var(--text-4)', padding: '4px 8px' }}>
                  +{portfolio.length - 5} more
                </li>
              )}
            </ul>
            <button style={viewPortfolioBtn} onClick={() => handleTabSwitch('portfolio')}>
              View all <ChevronDown size={11} style={{ transform: 'rotate(-90deg)' }} aria-hidden />
            </button>
          </section>
        )}
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main style={mainArea} aria-label={activeTab === 'browse' ? 'Market browser' : 'Portfolio'}>

        {/* Topbar */}
        <header style={topbar}>
          <label style={searchBox} htmlFor="ticker-search">
            <Search size={14} style={{ color: activeTab === 'portfolio' ? 'var(--border-2)' : 'var(--text-3)', flexShrink: 0 }} aria-hidden />
            <input
              id="ticker-search"
              style={{ ...searchInput, opacity: activeTab === 'portfolio' ? 0.45 : 1, cursor: activeTab === 'portfolio' ? 'pointer' : 'text' }}
              placeholder={activeTab === 'portfolio' ? 'Switch to Browse to search…' : 'Search tickers, companies…'}
              value={activeTab === 'portfolio' ? '' : searchQuery}
              readOnly={activeTab === 'portfolio'}
              onChange={(e) => { if (activeTab === 'browse') setSearchQuery(e.target.value); }}
              onClick={() => { if (activeTab === 'portfolio') handleTabSwitch('browse'); }}
              spellCheck={false}
              aria-label="Search tickers and companies"
            />
            {activeTab === 'browse' && searchQuery && (
              <button style={clearBtn} onClick={() => setSearchQuery('')} aria-label="Clear search">
                <X size={13} aria-hidden />
              </button>
            )}
          </label>
          <button
            style={refreshBtn}
            onClick={() => activeTab === 'browse' ? refetchBrowse() : refetchPortfolio()}
            aria-label="Refresh market data"
          >
            <RefreshCw size={14} aria-hidden />
          </button>
        </header>

        {/* ── Search results ───────────────────────────────────────── */}
        {isSearchActive && (
          <section style={content} aria-label="Search results" aria-live="polite">
            <h2 style={pageTitle}>
              {isSearching ? 'Searching…' : searchError ? 'Search error' : `${searchResults.length} results for "${searchQuery}"`}
            </h2>
            {searchError && <p role="alert" style={{ color: 'var(--red)', fontSize: 13 }}>{searchError}</p>}
            {isSearching ? (
              <ul style={{ ...cardGrid, listStyle: 'none', padding: 0, margin: 0 }} aria-label="Loading results">
                {[...Array(8)].map((_, i) => <li key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} aria-hidden />)}
              </ul>
            ) : searchResults.length === 0 && !searchError ? (
              <EmptyState title="No results found" sub="Try a different ticker symbol or company name" />
            ) : (
              <ul style={{ ...cardGrid, listStyle: 'none', padding: 0, margin: 0 }}>
                {searchResults.map((ticker) => {
                  const snap = searchSnapshotMap[ticker.ticker];
                  if (!snap) return (
                    <li key={ticker.ticker}>
                      <article style={searchResultCard} onClick={() => setSelectedTicker(ticker.ticker)} role="button" tabIndex={0} aria-label={`${ticker.ticker} — ${ticker.name}`}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 14, margin: 0 }}>{ticker.ticker}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, marginBottom: 0 }}>{ticker.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, marginBottom: 0 }}>{ticker.primary_exchange} · {ticker.type}</p>
                      </article>
                    </li>
                  );
                  return (
                    <li key={ticker.ticker}>
                      <TickerCard snapshot={snap} name={ticker.name} onClick={() => setSelectedTicker(ticker.ticker)} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ── Browse tab ───────────────────────────────────────────── */}
        {!isSearchActive && activeTab === 'browse' && (
          <section style={content} aria-labelledby="browse-heading">
            <hgroup style={pageTitleRow}>
              <h2 id="browse-heading" style={pageTitle}>Market Overview</h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Top US equities by market cap</p>
            </hgroup>
            <ErrorBoundary>
              {browseLoading ? (
                <ul style={{ ...cardGrid, listStyle: 'none', padding: 0, margin: 0 }} aria-label="Loading equities">
                  {[...Array(12)].map((_, i) => <li key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} aria-hidden />)}
                </ul>
              ) : !browseSnapshots?.length ? (
                <EmptyState title="No data available" sub="Market may be closed or data is loading" />
              ) : (
                <ul style={{ ...cardGrid, listStyle: 'none', padding: 0, margin: 0 }}>
                  {browseSnapshots.map((snap) => (
                    <li key={snap.ticker}>
                      <TickerCard snapshot={snap} name={nameMap[snap.ticker]} onClick={() => setSelectedTicker(snap.ticker)} />
                    </li>
                  ))}
                </ul>
              )}
            </ErrorBoundary>
          </section>
        )}

        {/* ── Portfolio tab ────────────────────────────────────────── */}
        {activeTab === 'portfolio' && (
          <section style={content} aria-labelledby="portfolio-heading">
            {portfolio.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, paddingTop: 80 }}>
                <Briefcase size={36} style={{ color: 'var(--border-2)' }} aria-hidden />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-2)', margin: 0 }}>
                  Your portfolio is empty
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', maxWidth: 300, margin: 0 }}>
                  Browse equities and click <strong style={{ color: 'var(--text-2)' }}>+</strong> to add them to your portfolio
                </p>
                <button style={goToBrowseBtn} onClick={() => handleTabSwitch('browse')}>
                  Browse Equities
                </button>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <dl style={portfolioSummaryBar} aria-label="Portfolio summary">
                  <div style={summaryItem}>
                    <dt style={summaryLabel}>Holdings</dt>
                    <dd style={{ ...summaryValue, margin: 0 }}>{portfolio.length}</dd>
                  </div>
                  <span style={summaryDivider} aria-hidden />
                  <div style={summaryItem}>
                    <dt style={summaryLabel}>Aggregate Price Pts</dt>
                    <dd style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--text-4)', margin: 0 }}>
                      ${portfolioValue.toFixed(2)}
                    </dd>
                  </div>
                  <span style={summaryDivider} aria-hidden />
                  <div style={summaryItem}>
                    <dt style={summaryLabel}>Day's Change</dt>
                    <dd style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: changeColor(portfolioChange), margin: 0 }}>
                      {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                {/* Portfolio table */}
                <section aria-label="Portfolio holdings" style={portfolioTableWrap}>
                  <table style={portfolioTable} aria-label="Holdings table">
                    <thead>
                      <tr>
                        <th style={thCell} scope="col">Ticker</th>
                        <th style={{ ...thCell, textAlign: 'right' }} scope="col">Price</th>
                        <th style={{ ...thCell, textAlign: 'right' }} scope="col">Change</th>
                        <th style={{ ...thCell, textAlign: 'right' }} scope="col">% Change</th>
                        <th style={{ ...thCell, textAlign: 'right' }} scope="col">Volume</th>
                        <th style={{ ...thCell, width: 120 }} scope="col">30d</th>
                        <th style={{ ...thCell, width: 60, textAlign: 'center' }} scope="col">Notes</th>
                        <th style={{ ...thCell, width: 40 }} scope="col"><span className="sr-only">Remove</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((entry) => {
                        const s = portfolioSnapshotMap[entry.ticker];
                        const price = s ? extractPrice(s) : undefined;
                        const chg = s?.todaysChangePerc;
                        const isEditing = editingNotes === entry.ticker;
                        const hasDistinctName =
                          !!entry.name && entry.name.trim().toUpperCase() !== entry.ticker.toUpperCase();
                        const primaryLabel = hasDistinctName ? entry.name : entry.ticker;

                        return (
                          <>
                            <tr
                              key={`row-${entry.ticker}`}
                              style={tableRow}
                              onClick={() => !isEditing && setSelectedTicker(entry.ticker)}
                              aria-label={`${entry.ticker} — click to view details`}
                            >
                              <td style={tdTicker}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-4)' }}>
                                  {primaryLabel}
                                </span>
                                {hasDistinctName && (
                                  <span
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: 11,
                                      color: 'var(--text-3)',
                                      display: 'block',
                                      marginTop: 1,
                                    }}
                                  >
                                    {entry.ticker}
                                  </span>
                                )}
                              </td>
                              <td style={{ ...tdCell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-4)' }}>
                                {portfolioLoading
                                  ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 16 }} aria-hidden />
                                  : fmtPrice(price)}
                              </td>
                              <td style={{ ...tdCell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(s?.todaysChange) }}>
                                {portfolioLoading ? '—' : fmtChange(s?.todaysChange)}
                              </td>
                              <td style={{ ...tdCell, textAlign: 'right' }}>
                                {portfolioLoading ? '—' : (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(chg), background: changeBg(chg), padding: '2px 7px', borderRadius: 4 }}>
                                    {fmtPct(chg)}
                                  </span>
                                )}
                              </td>
                              <td style={{ ...tdCell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                                {portfolioLoading ? '—' : fmtVolume(s?.day?.v)}
                              </td>
                              <td style={{ width: 120 }} onClick={(e) => e.stopPropagation()}>
                                {s && <MiniChart ticker={entry.ticker} change={chg ?? 0} width={120} height={32} />}
                              </td>
                              <td style={{ width: 60, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <button style={iconBtn} onClick={() => handleNotesEdit(entry.ticker, entry.notes)} aria-label={`${entry.notes ? 'Edit' : 'Add'} notes for ${entry.ticker}`}>
                                  <FileText size={13} style={{ color: entry.notes ? 'var(--gold)' : 'var(--text-3)' }} aria-hidden />
                                </button>
                              </td>
                              <td style={{ width: 40, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <button style={iconBtn} onClick={() => removeFromPortfolio(entry.ticker)} aria-label={`Remove ${entry.ticker} from portfolio`}>
                                  <Trash2 size={13} style={{ color: 'var(--red)' }} aria-hidden />
                                </button>
                              </td>
                            </tr>

                            {/* Notes editor row */}
                            {isEditing && (
                              <tr key={`notes-${entry.ticker}`} onClick={(e) => e.stopPropagation()}>
                                <td colSpan={8} style={notesEditorCell}>
                                  <textarea
                                    style={notesTextarea}
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    placeholder="Add research notes…"
                                    autoFocus
                                    rows={3}
                                    aria-label={`Research notes for ${entry.ticker}`}
                                  />
                                  <menu style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                                    <li><button style={notesCancelBtn} onClick={() => setEditingNotes(null)}>Cancel</button></li>
                                    <li><button style={notesSaveBtn} onClick={() => handleNotesSave(entry.ticker)}>Save</button></li>
                                  </menu>
                                </td>
                              </tr>
                            )}

                            {/* Saved notes display row */}
                            {!isEditing && entry.notes && (
                              <tr key={`notesdisplay-${entry.ticker}`}>
                                <td colSpan={8} style={notesDisplayCell} onClick={() => handleNotesEdit(entry.ticker, entry.notes)}>
                                  <FileText size={11} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} aria-hidden />
                                  <span>{entry.notes}</span>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </section>

                {/* Portfolio news */}
                <ErrorBoundary>
                  <PortfolioNewsPanel tickers={portfolioTickers} />
                </ErrorBoundary>
              </>
            )}
          </section>
        )}
      </main>

      {/* ── Detail panel ─────────────────────────────────────────── */}
      {selectedTicker && (
        <ErrorBoundary>
          <TickerDetail ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
        </ErrorBoundary>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 }} aria-label="Empty state">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-2)', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>{sub}</p>
    </section>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shell: React.CSSProperties = { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0e1f35' };
const sidebar: React.CSSProperties = { width: 220, flexShrink: 0, borderRight: '1px solid rgba(98, 130, 167, 0.35)', background: '#101f34', display: 'flex', flexDirection: 'column', overflow: 'auto' };
const sideTop: React.CSSProperties = { padding: '16px 16px 12px' };
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ab2cd', background: 'transparent', border: 'none', padding: '4px 0', marginBottom: 16, cursor: 'pointer' };
const logoArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
const logoMark: React.CSSProperties = { width: 30, height: 30, objectFit: 'contain', display: 'block', borderRadius: 7, flexShrink: 0 };
const logoName: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: '#e8f1fb', lineHeight: 1.2, display: 'block' };
const logoLabel: React.CSSProperties = { fontSize: 10, color: '#88a4c4', letterSpacing: '0.06em', display: 'block' };
const sideNav: React.CSSProperties = { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid rgba(98, 130, 167, 0.3)', borderBottom: '1px solid rgba(98, 130, 167, 0.3)' };
const navItem = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, fontSize: 13,
  fontWeight: active ? 600 : 400, color: active ? '#e8f1fb' : '#9ab2cd',
  background: active ? '#1b3456' : 'transparent', border: 'none',
  transition: 'all 0.15s', cursor: 'pointer', textAlign: 'left',
});
const badge: React.CSSProperties = { marginLeft: 'auto', background: 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 };
const sidePortfolioCard: React.CSSProperties = { margin: '12px', background: '#152844', border: '1px solid rgba(98, 130, 167, 0.35)', borderRadius: 10, padding: '12px' };
const sidePortfolioLabel: React.CSSProperties = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#88a4c4', fontWeight: 600, margin: 0 };
const sidePortfolioRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: 5, cursor: 'pointer', width: '100%', background: 'transparent', border: 'none' };
const viewPortfolioBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-4)', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 8, padding: '4px 6px' };

const mainArea: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0e1f35' };
const topbar: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid rgba(98, 130, 167, 0.35)', display: 'flex', alignItems: 'center', gap: 10, background: '#101f34', flexShrink: 0 };
const searchBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: '#152844', border: '1px solid rgba(98, 130, 167, 0.34)', borderRadius: 9, padding: '0 12px', height: 38, cursor: 'text' };
const searchInput: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#dce9f7', fontFamily: 'var(--font-sans)' };
const clearBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#9ab2cd', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 2 };
const refreshBtn: React.CSSProperties = { background: '#152844', border: '1px solid rgba(98, 130, 167, 0.34)', color: '#bfd3ea', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

const content: React.CSSProperties = { flex: 1, overflow: 'auto', padding: '20px 20px' };
const pageTitleRow: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 };
const pageTitle: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#eef5ff', marginBottom: 16, marginTop: 0 };
const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(192px, 1fr))', gap: 12 };
const searchResultCard: React.CSSProperties = { background: '#152844', border: '1px solid rgba(98, 130, 167, 0.34)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' };

// Portfolio
const portfolioSummaryBar: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#152844', border: '1px solid rgba(98, 130, 167, 0.34)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' };
const summaryItem: React.CSSProperties = { padding: '14px 24px', flex: 1 };
const summaryLabel: React.CSSProperties = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#88a4c4', fontWeight: 600, marginBottom: 4 };
const summaryValue: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: '#e8f1fb' };
const summaryDivider: React.CSSProperties = { width: 1, background: 'rgba(98, 130, 167, 0.28)', alignSelf: 'stretch', display: 'block' };

const portfolioTableWrap: React.CSSProperties = { background: '#152844', border: '1px solid rgba(98, 130, 167, 0.34)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 };
const portfolioTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thCell: React.CSSProperties = { padding: '10px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ab2cd', fontWeight: 600, background: '#1b3456', borderBottom: '1px solid rgba(98, 130, 167, 0.28)', textAlign: 'left' };
const tableRow: React.CSSProperties = { cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid rgba(98, 130, 167, 0.2)' };
const tdTicker: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };
const tdCell: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };
const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 5 };

const notesEditorCell: React.CSSProperties = { padding: '0 16px 12px', borderBottom: '1px solid rgba(98, 130, 167, 0.2)' };
const notesTextarea: React.CSSProperties = { width: '100%', background: '#1b3456', border: '1px solid rgba(98, 130, 167, 0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#e6f0fb', fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none', lineHeight: 1.5, marginTop: 8 };
const notesCancelBtn: React.CSSProperties = { fontSize: 12, padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(98, 130, 167, 0.3)', background: 'transparent', color: '#bfd3ea', cursor: 'pointer' };
const notesSaveBtn: React.CSSProperties = { fontSize: 12, padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 600, cursor: 'pointer' };
const notesDisplayCell: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 16px 10px', borderBottom: '1px solid rgba(98, 130, 167, 0.2)', fontSize: 12, color: '#bfd3ea', background: 'rgba(63,99,151,0.2)', cursor: 'pointer', lineHeight: 1.5 };

const goToBrowseBtn: React.CSSProperties = { background: 'var(--gold)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 };
