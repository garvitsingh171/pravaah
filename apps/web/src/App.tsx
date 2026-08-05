import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedAppShell from './app/ProtectedAppShell';
import PublicErrorBoundary from './components/public/PublicErrorBoundary';
import LoginPage from './features/auth/LoginPage';
import SignUpPage from './features/auth/SignUpPage';
import ClinicOnboardingPage from './features/onboarding/ClinicOnboardingPage';
import PublicLandingPage from './features/public/PublicLandingPage';
import { dashboardRoutes } from './routes/dashboardRoutes';
import NotFoundPage from './routes/NotFoundPage';
import RouteMetadata from './routes/RouteMetadata';

export function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PublicErrorBoundary>
                        <PublicLandingPage />
                    </PublicErrorBoundary>
                }
            />
            <Route
                path="/login/*"
                element={
                    <PublicErrorBoundary>
                        <LoginPage />
                    </PublicErrorBoundary>
                }
            />
            <Route
                path="/sign-up/*"
                element={
                    <PublicErrorBoundary>
                        <SignUpPage />
                    </PublicErrorBoundary>
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
                    <PublicErrorBoundary>
                        <ClinicOnboardingPage />
                    </PublicErrorBoundary>
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
                    <PublicErrorBoundary>
                        <NotFoundPage />
                    </PublicErrorBoundary>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <RouteMetadata />
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
