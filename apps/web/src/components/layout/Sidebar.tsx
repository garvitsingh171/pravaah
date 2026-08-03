import { NavLink } from 'react-router-dom';
import { PravaahLogo } from '../brand';
import type { AppRoute } from '../../routes/dashboardRoutes';

type NavigationIconName = AppRoute['navigationIcon'];

const navigationIconPaths: Record<NavigationIconName, string[]> = {
    dashboard: [
        'M3 13h8V3H3v10Z',
        'M13 21h8V11h-8v10Z',
        'M13 9h8V3h-8v6Z',
        'M3 21h8v-6H3v6Z',
    ],
    doctors: [
        'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
        'M4 21a8 8 0 0 1 16 0',
        'M19 8v4',
        'M21 10h-4',
    ],
    patients: [
        'M16 11a4 4 0 1 0-8 0',
        'M4 21a8 8 0 0 1 16 0',
        'M18 4a3 3 0 0 1 0 6',
        'M22 21a6 6 0 0 0-4-5.66',
    ],
    appointments: [
        'M7 3v4',
        'M17 3v4',
        'M4 9h16',
        'M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
        'm9 14 2 2 4-5',
    ],
    queue: [
        'M7 7h14',
        'M7 12h14',
        'M7 17h14',
        'M3 7h.01',
        'M3 12h.01',
        'M3 17h.01',
    ],
    settings: [
        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
        'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.08V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.12.7.33 1 .6.3.28.48.66.5 1.08V11a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z',
    ],
};

type SidebarProps = {
    navigationItems: AppRoute[];
    clinicName: string;
    clinicMeta: string;
};

function NavigationIcon({ name }: { name: NavigationIconName }) {
    return (
        <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {navigationIconPaths[name].map((path) => (
                <path key={path} d={path} />
            ))}
        </svg>
    );
}

function Sidebar({ navigationItems, clinicName, clinicMeta }: SidebarProps) {
    return (
        <aside className="border-b border-slate-200 bg-white md:flex md:min-h-screen md:w-72 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
            <div className="px-4 py-4 md:px-5 md:py-6">
                <PravaahLogo layout="horizontal" surface="light" size="md" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Clinic Workspace
                </p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="truncate text-sm font-semibold text-slate-950">{clinicName}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{clinicMeta}</p>
                </div>
            </div>

            <nav
                className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-1 md:flex-col md:overflow-visible md:px-3"
                aria-label="Clinic workspace navigation"
            >
                {navigationItems.map((item) => {
                    const label = item.navigationLabel ?? item.title;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                `group flex min-w-[10rem] items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 md:min-w-0 md:w-full ${
                                    isActive
                                        ? 'border-teal-200 bg-teal-50 text-slate-950 shadow-sm'
                                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`flex h-9 w-9 items-center justify-center rounded-md ${
                                            isActive
                                                ? 'bg-white text-teal-700 ring-1 ring-teal-200'
                                                : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                                        }`}
                                    >
                                        <NavigationIcon name={item.navigationIcon} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate">{label}</span>
                                        <span
                                            className={`mt-0.5 hidden truncate text-xs font-medium md:block ${
                                                isActive ? 'text-teal-800' : 'text-slate-500'
                                            }`}
                                        >
                                            {item.navigationDescription}
                                        </span>
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="hidden border-t border-slate-200 px-5 py-4 text-xs leading-5 text-slate-500 md:block">
                Appointment booking, risk review, and queue decisions stay with Admin and Staff.
            </div>
        </aside>
    );
}

export default Sidebar;
