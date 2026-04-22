/**
 * components/PortfolioNewsPanel.tsx
 * Collapsible news feed scoped to the current portfolio tickers.
 * Uses <section>, <ul>/<li>, <article>, <time> for semantic markup.
 */

import { useState } from 'react';
import { ExternalLink, Newspaper, ChevronDown } from 'lucide-react';
import { usePortfolioNews } from '../hooks/useMarketData';
import { timeAgo } from '../api/format';

interface Props {
  tickers: string[];
}

export function PortfolioNewsPanel({ tickers }: Props) {
  const [open, setOpen] = useState(true);
  const { data: news, isLoading } = usePortfolioNews(tickers, 8);

  const primaryTicker = tickers[0] ?? null;
  const label = primaryTicker
    ? `Recent News · ${tickers.slice(0, 3).join(', ')}${tickers.length > 3 ? ` +${tickers.length - 3}` : ''}`
    : 'Market News';

  return (
    <section aria-label="Portfolio news" style={panelWrap}>
      <button
        style={panelHeader}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="portfolio-news-body"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Newspaper size={14} style={{ color: 'var(--gold)' }} aria-hidden />
          <span style={panelTitle}>{label}</span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          style={{
            color: 'var(--text-3)',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </button>

      {open && (
        <div id="portfolio-news-body">
          {isLoading ? (
            <ul style={skeletonList} aria-label="Loading news">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="skeleton" style={{ height: 68, borderRadius: 8 }} />
              ))}
            </ul>
          ) : !news?.length ? (
            <p style={emptyMsg}>No recent news available</p>
          ) : (
            <ul style={newsList} role="list">
              {news.map((item) => (
                <li key={item.id}>
                  <article>
                    <a href={item.article_url} target="_blank" rel="noreferrer" style={newsRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={newsTitle}>{item.title}</p>
                        <footer style={newsMeta}>
                          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{item.publisher.name}</span>
                          <span style={{ color: 'var(--border-2)' }} aria-hidden>·</span>
                          <time dateTime={item.published_utc}>{timeAgo(item.published_utc)}</time>
                          {item.tickers?.length > 0 && (
                            <>
                              <span style={{ color: 'var(--border-2)' }} aria-hidden>·</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                                {item.tickers.slice(0, 3).join(' ')}
                              </span>
                            </>
                          )}
                        </footer>
                      </div>
                      <ExternalLink size={11} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} aria-hidden />
                    </a>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

const panelWrap: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  overflow: 'hidden',
};
const panelHeader: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', background: 'var(--surface-3)', border: 'none',
  borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
};
const panelTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--text-2)',
};
const skeletonList: React.CSSProperties = {
  listStyle: 'none', padding: '12px 16px', margin: 0, display: 'flex', flexDirection: 'column', gap: 8,
};
const emptyMsg: React.CSSProperties = {
  padding: '20px 16px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center', margin: 0,
};
const newsList: React.CSSProperties = {
  listStyle: 'none', padding: 0, margin: 0,
};
const newsRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 12,
  padding: '11px 16px', borderBottom: '1px solid var(--border)',
  textDecoration: 'none', transition: 'background 0.15s',
};
const newsTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'var(--text)',
  lineHeight: 1.45, marginBottom: 4, marginTop: 0,
};
const newsMeta: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 11, color: 'var(--text-3)',
};
