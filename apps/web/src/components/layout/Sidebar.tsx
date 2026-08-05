import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const desktopNavigationMediaQuery = '(min-width: 768px)';

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

function WorkspaceNavigation({
    navigationItems,
    onNavigate,
}: {
    navigationItems: AppRoute[];
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex flex-col gap-2" aria-label="Clinic workspace navigation">
            {navigationItems.map((item) => {
                const label = item.navigationLabel ?? item.title;

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `group flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                                isActive
                                    ? 'border-teal-200 bg-teal-50 text-slate-950 shadow-sm'
                                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
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
                                        className={`mt-0.5 block truncate text-xs font-medium ${
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
    );
}

function MobileWorkspaceNavigation({ navigationItems, clinicName, clinicMeta }: SidebarProps) {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLElement>(null);
    const locationKeyRef = useRef(location.key);

    const closeMenu = useCallback((restoreFocus = true) => {
        setIsOpen(false);

        if (restoreFocus) {
            window.setTimeout(() => triggerButtonRef.current?.focus(), 0);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            locationKeyRef.current = location.key;
            return;
        }

        if (locationKeyRef.current !== location.key) {
            locationKeyRef.current = location.key;
            closeMenu(false);
        }
    }, [closeMenu, isOpen, location.key]);

    useEffect(() => {
        if (!isOpen || typeof window.matchMedia !== 'function') {
            return undefined;
        }

        const mediaQueryList = window.matchMedia(desktopNavigationMediaQuery);
        const handleBreakpointChange = (event: MediaQueryListEvent) => {
            if (event.matches) {
                closeMenu(false);
            }
        };

        if (mediaQueryList.matches) {
            closeMenu(false);
            return undefined;
        }

        mediaQueryList.addEventListener('change', handleBreakpointChange);

        return () => {
            mediaQueryList.removeEventListener('change', handleBreakpointChange);
        };
    }, [closeMenu, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = Array.from(
                drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
            ).filter((element) => !element.hasAttribute('disabled'));

            if (focusableElements.length === 0) {
                event.preventDefault();
                drawerRef.current?.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (!drawerRef.current?.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? lastElement : firstElement).focus();
            } else if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeMenu, isOpen]);

    return (
        <div className="border-b border-slate-200 bg-white md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <PravaahLogo layout="horizontal" surface="light" size="sm" />
                <button
                    ref={triggerButtonRef}
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                    aria-label="Open clinic navigation"
                    aria-expanded={isOpen}
                    aria-controls="mobile-workspace-navigation"
                    onClick={() => setIsOpen(true)}
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M4 6h16" />
                        <path d="M4 12h16" />
                        <path d="M4 18h16" />
                    </svg>
                    Menu
                </button>
            </div>

            {isOpen ? (
                <div className="fixed inset-0 z-50 md:hidden" role="presentation">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/40"
                        aria-label="Dismiss clinic navigation overlay"
                        onClick={() => closeMenu()}
                    />
                    <aside
                        ref={drawerRef}
                        id="mobile-workspace-navigation"
                        role="dialog"
                        aria-modal="true"
                        className="absolute inset-y-0 left-0 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-xl"
                        aria-label="Clinic workspace navigation menu"
                        tabIndex={-1}
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
                            <div className="min-w-0">
                                <PravaahLogo layout="horizontal" surface="light" size="sm" />
                                <p className="mt-3 break-words text-sm font-semibold leading-5 text-slate-950">
                                    {clinicName}
                                </p>
                                <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                                    {clinicMeta}
                                </p>
                            </div>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                                aria-label="Close clinic navigation"
                                onClick={() => closeMenu()}
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 px-3 py-4">
                            <WorkspaceNavigation
                                navigationItems={navigationItems}
                                onNavigate={() => closeMenu(false)}
                            />
                        </div>
                    </aside>
                </div>
            ) : null}
        </div>
    );
}

function Sidebar({ navigationItems, clinicName, clinicMeta }: SidebarProps) {
    return (
        <aside className="hidden border-r border-slate-200 bg-white md:flex md:min-h-screen md:w-72 md:shrink-0 md:flex-col">
            <div className="px-4 py-4 md:px-5 md:py-6">
                <PravaahLogo layout="horizontal" surface="light" size="md" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Clinic Workspace
                </p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="break-words text-sm font-semibold leading-5 text-slate-950">
                        {clinicName}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                        {clinicMeta}
                    </p>
                </div>
            </div>

            <div className="flex-1 px-3 pb-4">
                <WorkspaceNavigation navigationItems={navigationItems} />
            </div>

            <div className="hidden border-t border-slate-200 px-5 py-4 text-xs leading-5 text-slate-500 md:block">
                Appointment booking, risk review, and queue decisions stay with Admin and Staff.
            </div>
        </aside>
    );
}

export { MobileWorkspaceNavigation };
export default Sidebar;
