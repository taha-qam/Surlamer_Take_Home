/**
 * components/MiniChart.tsx
 * Sparkline area chart for ticker cards.  Wrapped in <figure> for semantic
 * meaning — it is a self-contained graphical element.
 */

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { useAggregates } from '../hooks/useMarketData';
import { fmtPrice } from '../api/format';

interface Props {
  ticker: string;
  change: number;
  width?: number;
  height?: number;
}

export function MiniChart({ ticker, change, width = 100, height = 38 }: Props) {
  const color = change >= 0 ? '#3fb950' : '#f85149';
  const { data, isLoading } = useAggregates(ticker, 30);

  if (isLoading || !data?.length) {
    return (
      <figure
        aria-label={`Loading chart for ${ticker}`}
        style={{ margin: 0, width, height, borderRadius: 4 }}
        className="skeleton"
      />
    );
  }

  const chartData = data.map((b) => ({ v: b.c }));
  const gradientId = `mini-grad-${ticker}`;

  return (
    <figure aria-label={`30-day price chart for ${ticker}`} style={{ margin: 0 }}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
            itemStyle={{ color: 'var(--text-2)' }}
            formatter={(v) => [fmtPrice(v as number), '']}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
