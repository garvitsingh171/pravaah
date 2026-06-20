import { useEffect, useState } from 'react';
import AppLayout from './app/AppLayout';
import { getRouteForPath, navigationRoutes, normalizeRoutePath } from './routes/dashboardRoutes';

const getCurrentPath = (): string => normalizeRoutePath(window.location.pathname);

function App() {
    const [currentPath, setCurrentPath] = useState(getCurrentPath);
    const currentRoute = getRouteForPath(currentPath);

    useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(getCurrentPath());
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleNavigate = (href: string) => {
        const nextPath = normalizeRoutePath(href);

        if (nextPath !== currentPath) {
            window.history.pushState(null, '', nextPath);
            setCurrentPath(nextPath);
        }
    };

    return (
        <AppLayout
            currentPath={currentPath}
            navigationItems={navigationRoutes.map((route) => ({
                label: route.title,
                href: route.path,
            }))}
            pageTitle={currentRoute.title}
            onNavigate={handleNavigate}
        >
            {currentRoute.element}
        </AppLayout>
    );
}

export default App;
