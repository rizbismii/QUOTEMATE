"use client";

import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <main className="grid min-h-dvh place-items-center px-4 text-center">
            <div>
              <p className="font-display text-2xl">Couldn’t open this page</p>
              <p className="mt-2 text-sm text-ink-soft">Refresh, or open the Pay button link again from the invoice.</p>
            </div>
          </main>
        )
      );
    }
    return this.props.children;
  }
}
