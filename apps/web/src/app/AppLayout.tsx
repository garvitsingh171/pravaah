import type { ReactNode } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

type AppLayoutProps = {
    children?: ReactNode;
    userContext?: string;
};

const getActiveNavigationItem = () => {
    const currentPath = typeof window === 'undefined' ? '/dashboard' : window.location.pathname;

    const label =
        currentPath
            .split('/')
            .filter(Boolean)
            .pop()
            ?.replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase()) ?? 'Dashboard';

    return { href: currentPath, label };
};

function AppLayout({ children, userContext = 'Clinic Staff' }: AppLayoutProps) {
    const activeNavigationItem = getActiveNavigationItem();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="flex min-h-screen flex-col md:flex-row">
                <Sidebar activeHref={activeNavigationItem.href} />

                <div className="flex min-h-screen flex-1 flex-col">
                    <Topbar title={activeNavigationItem.label} userContext={userContext} />

                    <main className="flex-1 p-4 md:p-6">
                        {children ?? (
                            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 md:p-8">
                                <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                                    {activeNavigationItem.label}
                                </p>

                                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                                    {activeNavigationItem.label} workspace
                                </h1>

                                <p className="mt-4 max-w-2xl text-slate-600">
                                    This area is ready for the related clinic staff screen while
                                    this issue stays focused on shared application structure and
                                    navigation.
                                </p>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AppLayout;
