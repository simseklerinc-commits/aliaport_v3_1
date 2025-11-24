import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  private errorResetTimer: NodeJS.Timeout | null = null;

  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Increment error count to detect error loops
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
    
    // Basit log - gelecekte Sentry vs entegre edilebilir
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary caught:', error, info);
    
    // Auto-recovery: If same error happens multiple times, force a full page reload
    if (this.state.errorCount > 3) {
      console.warn('Error boundary: Too many consecutive errors, reloading page...');
      window.location.href = window.location.origin;
    }
  }

  handleReset = () => {
    // Clear any pending reset timers
    if (this.errorResetTimer) {
      clearTimeout(this.errorResetTimer);
    }
    
    // Reset error state
    this.setState({ hasError: false, error: undefined, errorCount: 0 });
    
    // Auto-clear error after 10 seconds if app stays stable
    this.errorResetTimer = setTimeout(() => {
      this.setState({ errorCount: 0 });
    }, 10000);
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error);
      const isRepeatingError = this.state.errorCount > 3;
      
      return (
        <div className="fixed inset-0 bg-red-950/95 text-red-100 p-6 flex flex-col gap-4 z-50 overflow-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Arayüz Hatası</h1>
            <span className="text-xs bg-red-700 px-2 py-1 rounded">
              {this.state.errorCount > 1 ? `Error #${this.state.errorCount}` : 'Error'}
            </span>
          </div>
          
          <div className="text-sm">
            <p className="mb-2">{errorMessage}</p>
            {isRepeatingError && (
              <p className="text-yellow-200 bg-yellow-900/30 p-2 rounded text-xs">
                ⚠️ Aynı hata tekrar tekrar oluşuyor. Sayfayı yenileyeceğiz...
              </p>
            )}
          </div>
          
          <pre className="text-xs max-h-48 overflow-auto whitespace-pre-wrap border border-red-700 p-2 rounded bg-black/30 font-mono">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              disabled={isRepeatingError}
              className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRepeatingError ? 'Sayfayı Yeniliyor...' : 'Tekrar Dene'}
            </button>
            
            <button
              onClick={() => window.location.href = window.location.origin}
              className="px-3 py-1 text-xs rounded bg-slate-600 hover:bg-slate-700"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

