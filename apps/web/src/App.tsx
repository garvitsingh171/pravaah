import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedAppShell from './app/ProtectedAppShell';
import LoginPage from './features/auth/LoginPage';
import { dashboardRoutes, defaultDashboardPath } from './routes/dashboardRoutes';
import NotFoundPage from './routes/NotFoundPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login/*" element={<LoginPage />} />
                <Route element={<ProtectedAppShell />}>
                    <Route index element={<Navigate to={defaultDashboardPath} replace />} />
                    {dashboardRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path.replace(/^\//, '')}
                            element={route.element}
                        />
                    ))}
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
