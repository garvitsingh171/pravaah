import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedAppShell from './app/ProtectedAppShell';
import { LoadingState } from './components/feedback';
import PublicErrorBoundary from './components/public/PublicErrorBoundary';
import { dashboardRoutes } from './routes/dashboardRoutes';
import RouteMetadata from './routes/RouteMetadata';

const PublicLandingPage = lazy(() => import('./features/public/PublicLandingPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const SignUpPage = lazy(() => import('./features/auth/SignUpPage'));
const ClinicOnboardingPage = lazy(() => import('./features/onboarding/ClinicOnboardingPage'));
const NotFoundPage = lazy(() => import('./routes/NotFoundPage'));

function RouteLoadingFallback({ message = 'Loading page...' }: { message?: string }) {
    return (
        <div className="min-h-screen bg-app-background px-4 py-6 text-app-text">
            <div className="mx-auto w-full max-w-5xl">
                <LoadingState message={message} />
            </div>
        </div>
    );
}

function PublicRouteBoundary({ children }: { children: ReactNode }) {
    return (
        <PublicErrorBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
        </PublicErrorBoundary>
    );
}

function RouteScrollRestoration() {
    const location = useLocation();
    const previousPathnameRef = useRef(location.pathname);

    useEffect(() => {
        if (previousPathnameRef.current === location.pathname) {
            return;
        }

        previousPathnameRef.current = location.pathname;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname]);

    return null;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PublicRouteBoundary>
                        <PublicLandingPage />
                    </PublicRouteBoundary>
                }
            />
            <Route
                path="/login/*"
                element={
                    <PublicRouteBoundary>
                        <LoginPage />
                    </PublicRouteBoundary>
                }
            />
            <Route
                path="/sign-up/*"
                element={
                    <PublicRouteBoundary>
                        <SignUpPage />
                    </PublicRouteBoundary>
                }
            />
            <Route
                path="/onboarding"
                element={
                    <PublicErrorBoundary>
                        <Navigate to="/onboarding/clinic" replace />
                    </PublicErrorBoundary>
                }
            />
            <Route
                path="/onboarding/clinic"
                element={
                    <PublicRouteBoundary>
                        <ClinicOnboardingPage />
                    </PublicRouteBoundary>
                }
            />
            <Route element={<ProtectedAppShell />}>
                {dashboardRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path.replace(/^\//, '')}
                        element={route.element}
                    />
                ))}
            </Route>
            <Route
                path="*"
                element={
                    <PublicRouteBoundary>
                        <NotFoundPage />
                    </PublicRouteBoundary>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <RouteMetadata />
            <RouteScrollRestoration />
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
