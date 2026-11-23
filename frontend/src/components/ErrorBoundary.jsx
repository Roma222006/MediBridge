import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px 16px' }}>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-critical-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: 'var(--status-critical-solid)'
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading)', margin: '0 0 8px 0' }}>
              Something went wrong loading this view
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
              An unexpected error occurred while rendering this page component. You can try refreshing the page or navigating back to the home discovery portal.
            </p>
            {this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  color: 'var(--status-critical-text)',
                  overflowX: 'auto',
                  marginBottom: '20px'
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button variant="secondary" size="sm" onClick={this.handleGoHome} icon={<Home size={14} />}>
                Return to Home
              </Button>
              <Button variant="primary" size="sm" onClick={this.handleReload} icon={<RefreshCw size={14} />}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
