/**
 * error/ErrorBoundary.tsx
 * Class-based React error boundary.  Wrap any subtree to catch render errors
 * and show a fallback UI instead of crashing the whole application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 *   // Custom fallback:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production you'd forward this to a monitoring service (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <section style={containerStyle} role="alert" aria-live="assertive">
        <h2 style={headingStyle}>Something went wrong</h2>
        <p style={messageStyle}>
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button style={retryBtnStyle} onClick={this.handleReset}>
          Try again
        </button>
      </section>
    );
  }
}

// ─── Inline styles (intentionally minimal — keeps this component self-contained) ─

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '60px 24px',
  textAlign: 'center',
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 22,
  color: 'var(--text)',
};

const messageStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-3)',
  maxWidth: 360,
  lineHeight: 1.6,
};

const retryBtnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: '8px 20px',
  borderRadius: 8,
  border: '1px solid var(--border-2)',
  background: 'var(--surface-3)',
  color: 'var(--text-2)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
