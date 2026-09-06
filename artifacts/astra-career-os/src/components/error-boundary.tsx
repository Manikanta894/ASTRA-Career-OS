import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div
      className="grid min-h-screen w-full place-items-center p-6 text-[hsl(38_45%_96%)]"
      style={{
        background:
          'radial-gradient(46rem 30rem at 88% -10%, hsl(32 96% 62% / .12), transparent 55%), linear-gradient(168deg, hsl(228 36% 10%) 0%, hsl(226 31% 14%) 48%, hsl(225 29% 17%) 100%)',
      }}
    >
      <div className="w-full max-w-lg text-center">
        <div
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
          style={{ background: 'hsl(5 68% 52% / .16)', border: '1px solid hsl(5 68% 52% / .4)', color: 'hsl(5 78% 68%)' }}
        >
          ⚠
        </div>
        <h1 className="display mt-6 text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[hsl(38_45%_96%_/_0.62)]">
          This part of ASTRA hit an unexpected error. Your work is saved — try again, or reload the workspace.
        </p>
        {/* Dev only: messages can carry API responses and other internals. */}
        {import.meta.env.DEV ? (
          <pre
            className="mono mt-5 overflow-x-auto rounded-xl p-3 text-left text-xs"
            style={{ background: 'hsl(227 30% 12% / .8)', border: '1px solid hsl(38 45% 96% / .12)', color: 'hsl(38 45% 96% / .75)' }}
          >
            {error.message || String(error)}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={resetError}
          className="mt-6 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5"
          style={{ background: 'hsl(32 96% 62%)', color: 'hsl(225 28% 13%)', boxShadow: '0 10px 26px hsl(32 96% 62% / .3)' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
