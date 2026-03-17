import { Component, type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[AppErrorBoundary] Unhandled render error', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <section className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-6 text-center shadow-lg dark:border-red-400/40 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
              Application Error
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Ocurrio un error inesperado
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {this.state.errorMessage || 'Intenta recargar la aplicacion para continuar.'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Recargar aplicacion
            </button>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
