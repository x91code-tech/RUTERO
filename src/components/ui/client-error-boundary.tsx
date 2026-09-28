"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ClientErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ClientErrorBoundaryState = {
  failed: boolean;
};

export class ClientErrorBoundary extends Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  state: ClientErrorBoundaryState = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Client component failed", error, info);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
          No se pudo cargar este grafico en este dispositivo.
        </div>
      );
    }

    return this.props.children;
  }
}
