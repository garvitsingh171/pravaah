import type { ReactNode } from 'react';
import type { NavigationItem } from '../components/layout/Sidebar';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

type AppLayoutProps = {
    children?: ReactNode;
    currentPath: string;
    navigationItems: NavigationItem[];
    pageTitle: string;
    onNavigate?: (href: string) => void;
    userContext?: string;
};

function AppLayout({
    children,
    currentPath,
    navigationItems,
    pageTitle,
    onNavigate,
    userContext = 'Clinic Staff',
}: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="flex min-h-screen flex-col md:flex-row">
                <Sidebar
                    activeHref={currentPath}
                    navigationItems={navigationItems}
                    onNavigate={onNavigate}
                />

                <div className="flex min-h-screen flex-1 flex-col">
                    <Topbar title={pageTitle} userContext={userContext} />

                    <main className="flex-1 p-4 md:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}

export default AppLayout;
