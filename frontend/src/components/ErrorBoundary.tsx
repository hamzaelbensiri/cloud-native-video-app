import React from 'react';

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-xl border border-brand-line bg-red-950/30 p-4 text-sm text-red-200">
          <p className="font-semibold">Something went wrong.</p>
          <p className="mt-1">Try refreshing the page. If the issue persists, check the console.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
