import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Briefcase, LayoutGrid, ArrowLeft, ChevronDown, Trash2, FileText, RefreshCw } from 'lucide-react';
import { getSnapshots, searchTickers, POPULAR_TICKERS } from '../api/massive';
import type { TickerSnapshot, TickerInfo } from '../api/massive';
import { fmtPrice, fmtPct, fmtChange, fmtVolume, changeColor, changeBg } from '../api/format';
import { useStore } from '../store/workbench';
import { TickerCard } from '../components/TickerCard';
import { TickerDetail } from '../components/TickerDetail';
import { MiniChart } from '../components/MiniChart';
import './LandingPage';


const BROWSE_BATCH = POPULAR_TICKERS.slice(0, 24);

export function WorkbenchPage() {
  const navigate = useNavigate();
  const {
    portfolio, searchQuery, selectedTicker, activeTab,
    setSearchQuery, setSelectedTicker, setActiveTab,
    removeFromPortfolio, updateNotes
  } = useStore();

  const [searchResults, setSearchResults] = useState<TickerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search is only active when on the browse tab and there is a query
  const isSearchActive = activeTab === 'browse' && !!searchQuery.trim();

  // Switch tab — collapse search results so portfolio is never blocked
  const handleTabSwitch = (tab: 'browse' | 'portfolio') => {
    setActiveTab(tab);
    if (tab === 'portfolio') setSearchResults([]);
  };

  // Load snapshots for browse grid
  const { data: browseSnapshots, isLoading: browseLoading, refetch: refetchBrowse } = useQuery<TickerSnapshot[]>({
    queryKey: ['snapshots', 'browse'],
    queryFn: () => getSnapshots(BROWSE_BATCH),
    staleTime: 2 * 60000,
    enabled: activeTab === 'browse' && !isSearchActive,
  });

  // Load snapshots for portfolio
  const portfolioTickers = portfolio.map(e => e.ticker);
  const { data: portfolioSnapshots, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery<TickerSnapshot[]>({
    queryKey: ['snapshots', 'portfolio', portfolioTickers.join(',')],
    queryFn: () => getSnapshots(portfolioTickers),
    staleTime: 60000,
    enabled: portfolioTickers.length > 0,
  });

  // Search — only fires when on browse tab
  useEffect(() => {
    if (activeTab !== 'browse' || !searchQuery.trim()) { setSearchResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchTickers(searchQuery, 20);
        setSearchResults(results);
        const map: Record<string, string> = {};
        results.forEach(r => { map[r.ticker] = r.name; });
        setNameMap(prev => ({ ...prev, ...map }));
      } catch {
        setSearchResults([]);
      } finally { setIsSearching(false); }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, activeTab]);

  // Snapshot map for search results
  const [searchSnapshots, setSearchSnapshots] = useState<Record<string, TickerSnapshot>>({});
  useEffect(() => {
    if (searchResults.length === 0) return;
    const tickers = searchResults.map(r => r.ticker).slice(0, 20);
    getSnapshots(tickers).then(snaps => {
      const map: Record<string, TickerSnapshot> = {};
      snaps.forEach(s => { map[s.ticker] = s; });
      setSearchSnapshots(map);
    }).catch(() => {});
  }, [searchResults]);

  // Build name map from browse data
  useEffect(() => {
    // Names come from search results; for popular tickers we rely on ticker symbol
  }, []);

  const portfolioSnapshotMap: Record<string, TickerSnapshot> = {};
  portfolioSnapshots?.forEach(s => { portfolioSnapshotMap[s.ticker] = s; });

  const browseSnapshotMap: Record<string, TickerSnapshot> = {};
  browseSnapshots?.forEach(s => { browseSnapshotMap[s.ticker] = s; });

  const portfolioValue = portfolioTickers.reduce((sum, ticker) => {
    const s = portfolioSnapshotMap[ticker];
    return sum + (s?.day?.c || s?.prevDay?.c || 0);
  }, 0);

  const portfolioChange = portfolioTickers.reduce((sum, ticker) => {
    const s = portfolioSnapshotMap[ticker];
    return sum + (s?.todaysChange || 0);
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
      {/* Sidebar */}
      <aside style={sidebar}>
        <div style={sideTop}>
          <button onClick={() => navigate('/')} style={backBtn}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={logoArea}>
            <span style={logoMark}>S</span>
            <div>
              <div style={logoName}>Surlamer</div>
              <div style={logoLabel}>Equity Workbench</div>
            </div>
          </div>
        </div>

        <nav style={sideNav}>
          <button style={navItem(activeTab === 'browse')} onClick={() => handleTabSwitch('browse')}>
            <LayoutGrid size={15} />
            <span>Browse</span>
          </button>
          <button style={navItem(activeTab === 'portfolio')} onClick={() => handleTabSwitch('portfolio')}>
            <Briefcase size={15} />
            <span>Portfolio</span>
            {portfolio.length > 0 && <span style={badge}>{portfolio.length}</span>}
          </button>
        </nav>

        {/* Portfolio summary in sidebar */}
        {portfolio.length > 0 && activeTab === 'browse' && (
          <div style={sidePortfolioCard}>
            <div style={sidePortfolioLabel}>Your Portfolio</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {portfolio.slice(0, 5).map(entry => {
                const s = portfolioSnapshotMap[entry.ticker];
                const chg = s?.todaysChangePerc;
                return (
                  <div key={entry.ticker} style={sidePortfolioRow} onClick={() => setSelectedTicker(entry.ticker)}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{entry.ticker}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: changeColor(chg) }}>{fmtPct(chg)}</span>
                  </div>
                );
              })}
              {portfolio.length > 5 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 8px' }}>+{portfolio.length - 5} more</div>
              )}
            </div>
            <button style={viewPortfolioBtn} onClick={() => handleTabSwitch('portfolio')}>
              View all <ChevronDown size={11} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={mainArea}>
        {/* Topbar */}
        <div style={topbar}>
          <div style={searchBox} onClick={() => { if (activeTab === 'portfolio') handleTabSwitch('browse'); }}>
            <Search size={14} style={{ color: activeTab === 'portfolio' ? 'var(--border-2)' : 'var(--text-3)', flexShrink: 0 }} />
            <input
              style={{ ...searchInput, opacity: activeTab === 'portfolio' ? 0.45 : 1, cursor: activeTab === 'portfolio' ? 'pointer' : 'text' }}
              placeholder={activeTab === 'portfolio' ? 'Switch to Browse to search…' : 'Search tickers, companies…'}
              value={activeTab === 'portfolio' ? '' : searchQuery}
              readOnly={activeTab === 'portfolio'}
              onChange={e => { if (activeTab === 'browse') setSearchQuery(e.target.value); }}
              spellCheck={false}
            />
            {activeTab === 'browse' && searchQuery && (
              <button style={clearBtn} onClick={() => setSearchQuery('')}><X size={13} /></button>
            )}
          </div>
          <button
            style={refreshBtn}
            onClick={() => { activeTab === 'browse' ? refetchBrowse() : refetchPortfolio(); }}
            title="Refresh data"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* SEARCH RESULTS — only visible on browse tab */}
        {isSearchActive && (
          <div style={content}>
            <div style={pageTitle}>
              {isSearching ? 'Searching…' : `${searchResults.length} results for "${searchQuery}"`}
            </div>
            {isSearching ? (
              <div style={cardGrid}>
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState title="No results found" sub={`Try a different ticker symbol or company name`} />
            ) : (
              <div style={cardGrid}>
                {searchResults.map(ticker => {
                  const snap = searchSnapshots[ticker.ticker];
                  if (!snap) return (
                    <div key={ticker.ticker} style={searchResultCard} onClick={() => setSelectedTicker(ticker.ticker)}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 14 }}>{ticker.ticker}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{ticker.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{ticker.primary_exchange} · {ticker.type}</div>
                    </div>
                  );
                  return (
                    <TickerCard
                      key={ticker.ticker}
                      snapshot={snap}
                      name={ticker.name}
                      onClick={() => setSelectedTicker(ticker.ticker)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BROWSE TAB */}
        {!isSearchActive && activeTab === 'browse' && (
          <div style={content}>
            <div style={pageTitleRow}>
              <div style={pageTitle}>Market Overview</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Top US equities by market cap</div>
            </div>
            {browseLoading ? (
              <div style={cardGrid}>
                {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
              </div>
            ) : !browseSnapshots?.length ? (
              <EmptyState title="No data available" sub="Market may be closed or data is loading" />
            ) : (
              <div style={cardGrid}>
                {browseSnapshots.map(snap => (
                  <TickerCard
                    key={snap.ticker}
                    snapshot={snap}
                    name={nameMap[snap.ticker]}
                    onClick={() => setSelectedTicker(snap.ticker)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div style={content}>
            {portfolio.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, paddingTop: 80 }}>
                <Briefcase size={36} style={{ color: 'var(--border-2)' }} />
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-2)' }}>Your portfolio is empty</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', maxWidth: 300 }}>
                  Browse equities and click <strong style={{ color: 'var(--text-2)' }}>+</strong> to add them to your portfolio
                </div>
                <button style={goToBrowseBtn} onClick={() => handleTabSwitch('browse')}>
                  Browse Equities
                </button>
              </div>
            ) : (
              <>
                {/* Portfolio summary bar */}
                <div style={portfolioSummaryBar}>
                  <div style={summaryItem}>
                    <div style={summaryLabel}>Holdings</div>
                    <div style={summaryValue}>{portfolio.length}</div>
                  </div>
                  <div style={summaryDivider} />
                  <div style={summaryItem}>
                    <div style={summaryLabel}>Aggregate Price Pts</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>
                      ${portfolioValue.toFixed(2)}
                    </div>
                  </div>
                  <div style={summaryDivider} />
                  <div style={summaryItem}>
                    <div style={summaryLabel}>Day's Change</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: changeColor(portfolioChange) }}>
                      {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Portfolio table */}
                <div style={portfolioTable}>
                  <div style={tableHeader}>
                    <span style={thCell}>Ticker</span>
                    <span style={{ ...thCell, textAlign: 'right' }}>Price</span>
                    <span style={{ ...thCell, textAlign: 'right' }}>Change</span>
                    <span style={{ ...thCell, textAlign: 'right' }}>% Change</span>
                    <span style={{ ...thCell, textAlign: 'right' }}>Volume</span>
                    <span style={{ ...thCell, flex: '0 0 120px' }}>30d</span>
                    <span style={{ ...thCell, flex: '0 0 60px' }}>Notes</span>
                    <span style={{ ...thCell, flex: '0 0 40px' }}></span>
                  </div>

                  {portfolio.map(entry => {
                    const s = portfolioSnapshotMap[entry.ticker];
                    const price = s?.day?.c || s?.lastTrade?.p || s?.prevDay?.c;
                    const chg = s?.todaysChangePerc;
                    const isEditing = editingNotes === entry.ticker;

                    return (
                      <div key={entry.ticker}>
                        <div style={tableRow} onClick={() => !isEditing && setSelectedTicker(entry.ticker)}>
                          <div style={tdTicker}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 13 }}>{entry.ticker}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{entry.name || ''}</span>
                          </div>
                          <span style={{ ...tdCell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                            {portfolioLoading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 16 }} /> : fmtPrice(price)}
                          </span>
                          <span style={{ ...tdCell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(s?.todaysChange) }}>
                            {portfolioLoading ? '—' : fmtChange(s?.todaysChange)}
                          </span>
                          <span style={{ ...tdCell, textAlign: 'right' }}>
                            {portfolioLoading ? '—' : (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(chg), background: changeBg(chg), padding: '2px 7px', borderRadius: 4 }}>
                                {fmtPct(chg)}
                              </span>
                            )}
                          </span>
                          <span style={{ ...tdCell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                            {portfolioLoading ? '—' : fmtVolume(s?.day?.v)}
                          </span>
                          <div style={{ flex: '0 0 120px' }} onClick={e => e.stopPropagation()}>
                            {s && <MiniChart ticker={entry.ticker} change={chg ?? 0} width={120} height={32} />}
                          </div>
                          <div style={{ flex: '0 0 60px', display: 'flex', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                            <button style={iconBtn} onClick={() => handleNotesEdit(entry.ticker, entry.notes)} title="Edit notes">
                              <FileText size={13} style={{ color: entry.notes ? 'var(--gold)' : 'var(--text-3)' }} />
                            </button>
                          </div>
                          <div style={{ flex: '0 0 40px', display: 'flex', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                            <button style={iconBtn} onClick={() => removeFromPortfolio(entry.ticker)} title="Remove">
                              <Trash2 size={13} style={{ color: 'var(--red)' }} />
                            </button>
                          </div>
                        </div>

                        {/* Inline notes editor */}
                        {isEditing && (
                          <div style={notesEditor} onClick={e => e.stopPropagation()}>
                            <textarea
                              style={notesTextarea}
                              value={notesValue}
                              onChange={e => setNotesValue(e.target.value)}
                              placeholder="Add research notes…"
                              autoFocus
                              rows={3}
                            />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                              <button style={notesCancelBtn} onClick={() => setEditingNotes(null)}>Cancel</button>
                              <button style={notesSaveBtn} onClick={() => handleNotesSave(entry.ticker)}>Save</button>
                            </div>
                          </div>
                        )}

                        {/* Show saved notes */}
                        {!isEditing && entry.notes && (
                          <div style={notesDisplay} onClick={() => handleNotesEdit(entry.ticker, entry.notes)}>
                            <FileText size={11} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
                            <span>{entry.notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {selectedTicker && (
        <TickerDetail ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
      )}
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-2)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{sub}</div>
    </div>
  );
}

// Styles
const shell: React.CSSProperties = { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--surface)' };

const sidebar: React.CSSProperties = {
  width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
  background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', overflow: 'auto',
};
const sideTop: React.CSSProperties = { padding: '16px 16px 12px' };
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', background: 'transparent', border: 'none', padding: '4px 0', marginBottom: 16, cursor: 'pointer' };
const logoArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
const logoMark: React.CSSProperties = { width: 30, height: 30, background: 'var(--gold)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-serif)', flexShrink: 0 };
const logoName: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 };
const logoLabel: React.CSSProperties = { fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' };
const sideNav: React.CSSProperties = { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' };
const navItem = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400,
  color: active ? 'var(--text)' : 'var(--text-3)', background: active ? 'var(--surface-3)' : 'transparent',
  border: 'none', transition: 'all 0.15s', cursor: 'pointer', textAlign: 'left',
});
const badge: React.CSSProperties = { marginLeft: 'auto', background: 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 };
const sidePortfolioCard: React.CSSProperties = { margin: '12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px' };
const sidePortfolioLabel: React.CSSProperties = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', fontWeight: 600 };
const sidePortfolioRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: 5, cursor: 'pointer' };
const viewPortfolioBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 8, padding: '4px 6px' };

const mainArea: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const topbar: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', flexShrink: 0 };
const searchBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 12px', height: 38 };
const searchInput: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-sans)' };
const clearBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-3)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 2 };
const refreshBtn: React.CSSProperties = { background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

const content: React.CSSProperties = { flex: 1, overflow: 'auto', padding: '20px 20px' };
const pageTitleRow: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 };
const pageTitle: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 16 };
const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(192px, 1fr))', gap: 12 };
const searchResultCard: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' };

// Portfolio styles
const portfolioSummaryBar: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' };
const summaryItem: React.CSSProperties = { padding: '14px 24px', flex: 1 };
const summaryLabel: React.CSSProperties = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 };
const summaryValue: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--text)' };
const summaryDivider: React.CSSProperties = { width: 1, background: 'var(--border)', alignSelf: 'stretch' };

const portfolioTable: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' };
const tableHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' };
const thCell: React.CSSProperties = { flex: 1, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', fontWeight: 600 };
const tableRow: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' };
const tdTicker: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column' };
const tdCell: React.CSSProperties = { flex: 1 };
const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 5 };

const notesEditor: React.CSSProperties = { padding: '0 16px 12px', borderBottom: '1px solid var(--border)' };
const notesTextarea: React.CSSProperties = { width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none', lineHeight: 1.5 };
const notesCancelBtn: React.CSSProperties = { fontSize: 12, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' };
const notesSaveBtn: React.CSSProperties = { fontSize: 12, padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 600, cursor: 'pointer' };
const notesDisplay: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 16px 10px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', background: 'var(--gold-dim2)', cursor: 'pointer', lineHeight: 1.5 };

const goToBrowseBtn: React.CSSProperties = { background: 'var(--gold)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 };
