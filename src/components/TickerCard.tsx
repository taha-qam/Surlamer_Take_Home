/**
 * components/TickerCard.tsx
 * Card for a single equity in the browse grid.
 * Uses <article> (self-contained piece of content) with semantic sub-elements.
 */

import { Plus, Check, TrendingUp, TrendingDown } from 'lucide-react';
import type { TickerSnapshot } from '../services/market';
import { extractPrice } from '../services/market';
import { fmtPrice, fmtPct, fmtChange, fmtVolume, changeColor, changeBg } from '../api/format';
import { MiniChart } from './MiniChart';
import { useStore } from '../store/workbench';

interface Props {
  snapshot: TickerSnapshot;
  name?: string;
  onClick: () => void;
}

export function TickerCard({ snapshot, name, onClick }: Props) {
  const { addToPortfolio, removeFromPortfolio, isInPortfolio } = useStore();
  const inPortfolio = isInPortfolio(snapshot.ticker);
  const price = extractPrice(snapshot);
  const change = snapshot.todaysChangePerc;
  const isUp = change >= 0;

  const handlePortfolioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inPortfolio) removeFromPortfolio(snapshot.ticker);
    else addToPortfolio(snapshot.ticker, name ?? snapshot.ticker);
  };

  return (
    <article onClick={onClick} style={cardStyle} aria-label={`${snapshot.ticker} equity card`}>
      <header style={headerRow}>
        <hgroup style={{ margin: 0 }}>
          <p style={tickerLabel}>{snapshot.ticker}</p>
          {name && <p style={nameLabel}>{name}</p>}
        </hgroup>
        <button
          onClick={handlePortfolioClick}
          style={portfolioBtn(inPortfolio)}
          aria-label={inPortfolio ? `Remove ${snapshot.ticker} from portfolio` : `Add ${snapshot.ticker} to portfolio`}
          aria-pressed={inPortfolio}
        >
          {inPortfolio ? <Check size={13} /> : <Plus size={13} />}
        </button>
      </header>

      <p style={priceRow}>
        <span style={priceText}>{fmtPrice(price)}</span>
        <span
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontFamily: 'var(--font-mono)',
            color: changeColor(change), background: changeBg(change),
            padding: '2px 6px', borderRadius: 4,
          }}
          aria-label={`${fmtPct(change)} today`}
        >
          {isUp ? <TrendingUp size={11} aria-hidden /> : <TrendingDown size={11} aria-hidden />}
          {fmtPct(change)}
        </span>
      </p>

      <figure style={{ margin: '0 -4px' }} aria-hidden>
        <MiniChart ticker={snapshot.ticker} change={change} width={160} height={36} />
      </figure>

      <footer style={metaRow}>
        <dl style={{ display: 'flex', gap: 12, margin: 0 }}>
          <div style={metaItem}>
            <dt style={metaLabel}>Chng</dt>
            <dd style={{ margin: 0, color: changeColor(change), fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {fmtChange(snapshot.todaysChange)}
            </dd>
          </div>
          <div style={metaItem}>
            <dt style={metaLabel}>Vol</dt>
            <dd style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>
              {fmtVolume(snapshot.day?.v)}
            </dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '14px 16px',
  cursor: 'pointer',
  transition: 'border-color 0.18s, background 0.18s',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const tickerLabel: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontWeight: 500,
  fontSize: 14,
  color: 'var(--text)',
  letterSpacing: '0.03em',
};

const nameLabel: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: 11,
  color: 'var(--text-3)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 130,
};

const priceRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: 0,
};

const priceText: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 18,
  fontWeight: 500,
  color: 'var(--text)',
};

const metaRow: React.CSSProperties = { padding: 0 };

const metaItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const metaLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.08em',
  color: 'var(--text-3)',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
};

function portfolioBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--gold-dim)' : 'var(--surface-3)',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    color: active ? 'var(--gold)' : 'var(--text-3)',
    borderRadius: 6,
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
    cursor: 'pointer',
  };
}
