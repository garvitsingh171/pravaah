import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PravaahLogo } from '../brand';

type PublicErrorBoundaryProps = {
    children: ReactNode;
    resetKey: string;
};

type PublicErrorBoundaryState = {
    hasError: boolean;
};

class PublicErrorBoundaryInner extends Component<
    PublicErrorBoundaryProps,
    PublicErrorBoundaryState
> {
    state: PublicErrorBoundaryState = {
        hasError: false,
    };

    static getDerivedStateFromError(): PublicErrorBoundaryState {
        return { hasError: true };
    }

    componentDidUpdate(previousProps: PublicErrorBoundaryProps) {
        if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Public route rendering failed', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <main className="flex min-h-screen items-center bg-app-background px-4 py-10 text-app-text">
                <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-lg border border-app-border bg-white p-6 shadow-sm md:grid-cols-[0.85fr_1.15fr] md:p-8">
                    <div>
                        <PravaahLogo layout="horizontal" surface="light" size="md" />
                        <p className="mt-8 text-sm font-semibold uppercase text-brand-foreground">
                            Page recovery
                        </p>
                        <h1 className="mt-3 text-3xl font-bold leading-tight text-app-text">
                            This public page could not be displayed.
                        </h1>
                        <p className="mt-4 text-base leading-7 text-app-muted">
                            The clinic workspace is still protected. You can retry this page, return
                            home, or sign in if you were trying to reach the application.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                onClick={this.handleRetry}
                            >
                                Try again
                            </button>
                            <Link
                                to="/"
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-app-border-strong bg-white px-5 py-2.5 text-sm font-semibold text-app-muted transition hover:bg-app-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                onClick={this.handleRetry}
                            >
                                Return home
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-soft bg-brand-subtle px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                onClick={this.handleRetry}
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-lg border border-app-border bg-app-surface-muted p-5">
                        <svg
                            className="h-full min-h-56 w-full text-brand"
                            viewBox="0 0 520 300"
                            fill="none"
                            role="img"
                            aria-labelledby="public-error-illustration-title"
                        >
                            <title id="public-error-illustration-title">
                                Interrupted clinic workflow diagram
                            </title>
                            <path
                                d="M54 212 C119 110 184 110 250 176 S384 240 466 90"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />
                            <path
                                d="M54 212 C119 110 184 110 250 176"
                                stroke="#0F766E"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />
                            <g fill="white" stroke="#CBD5E1" strokeWidth="3">
                                <rect x="42" y="190" width="84" height="52" rx="8" />
                                <rect x="218" y="150" width="84" height="52" rx="8" />
                                <rect x="394" y="68" width="84" height="52" rx="8" />
                            </g>
                            <g fill="#0F172A" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">
                                <text x="67" y="222">Start</text>
                                <text x="236" y="182">Retry</text>
                                <text x="415" y="100">Home</text>
                            </g>
                        </svg>
                    </div>
                </section>
            </main>
        );
    }
}

function PublicErrorBoundary({ children }: { children: ReactNode }) {
    const location = useLocation();
    const resetKey = `${location.pathname}${location.search}${location.hash}`;

    return (
        <PublicErrorBoundaryInner resetKey={resetKey}>
            {children}
        </PublicErrorBoundaryInner>
    );
}

export default PublicErrorBoundary;
