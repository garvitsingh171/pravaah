import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedAppShell from './app/ProtectedAppShell';
import LoginPage from './features/auth/LoginPage';
import SignUpPage from './features/auth/SignUpPage';
import PublicLandingPage from './features/public/PublicLandingPage';
import { dashboardRoutes } from './routes/dashboardRoutes';
import NotFoundPage from './routes/NotFoundPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<PublicLandingPage />} />
                <Route path="/login/*" element={<LoginPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route element={<ProtectedAppShell />}>
                    {dashboardRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path.replace(/^\//, '')}
                            element={route.element}
                        />
                    ))}
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
