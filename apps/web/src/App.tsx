import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoadingState } from './components/feedback';
import PublicErrorBoundary from './components/public/PublicErrorBoundary';
import { dashboardRoutes, isProtectedWorkspacePath } from './routes/dashboardRoutes';
import RouteMetadata from './routes/RouteMetadata';

const MarketingLayout = lazy(() => import('./features/marketing/MarketingLayout'));
const HomePage = lazy(() => import('./features/marketing/HomePage'));
const ProductPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({ default: module.ProductPage }))
);
const FeaturesIndexPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({
        default: module.FeaturesIndexPage,
    }))
);
const SolutionsPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({ default: module.SolutionsPage }))
);
const HowItWorksPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({
        default: module.HowItWorksPage,
    }))
);
const FaqPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({ default: module.FaqPage }))
);
const AboutPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({ default: module.AboutPage }))
);
const ContactPage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({ default: module.ContactPage }))
);
const FeaturePage = lazy(() =>
    import('./features/marketing/DetailPages').then((module) => ({ default: module.FeaturePage }))
);
const ProtectedAppShell = lazy(() => import('./app/ProtectedAppShell'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const SignUpPage = lazy(() => import('./features/auth/SignUpPage'));
const ClinicOnboardingPage = lazy(() => import('./features/onboarding/ClinicOnboardingPage'));
const StaffInvitationPage = lazy(() => import('./features/staff/StaffInvitationPage'));
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
        if (!isProtectedWorkspacePath(location.pathname)) {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
    }, [location.pathname]);

    return null;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route
                element={
                    <PublicRouteBoundary>
                        <MarketingLayout />
                    </PublicRouteBoundary>
                }
            >
                <Route path="/" element={<HomePage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/features" element={<FeaturesIndexPage />} />
                <Route
                    path="/features/appointments"
                    element={<FeaturePage slug="appointments" />}
                />
                <Route path="/features/live-queue" element={<FeaturePage slug="live-queue" />} />
                <Route
                    path="/features/no-show-risk"
                    element={<FeaturePage slug="no-show-risk" />}
                />
                <Route
                    path="/features/clinic-management"
                    element={<FeaturePage slug="clinic-management" />}
                />
                <Route
                    path="/features/team-management"
                    element={<FeaturePage slug="team-management" />}
                />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
            </Route>
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
            <Route
                path="/invite/:token"
                element={
                    <PublicRouteBoundary>
                        <StaffInvitationPage />
                    </PublicRouteBoundary>
                }
            />
            <Route
                element={
                    <Suspense fallback={<RouteLoadingFallback message="Preparing workspace..." />}>
                        <ProtectedAppShell />
                    </Suspense>
                }
            >
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
