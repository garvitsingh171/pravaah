import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { PravaahLogoLink } from '../brand';
import type { AppRoute } from '../../routes/dashboardRoutes';

type NavigationIconName = AppRoute['navigationIcon'];

const navigationIconPaths: Record<NavigationIconName, string[]> = {
    dashboard: ['M3 13h8V3H3v10Z', 'M13 21h8V11h-8v10Z', 'M13 9h8V3h-8v6Z', 'M3 21h8v-6H3v6Z'],
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
    queue: ['M7 7h14', 'M7 12h14', 'M7 17h14', 'M3 7h.01', 'M3 12h.01', 'M3 17h.01'],
    staff: [
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
        'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
        'M22 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75',
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
    surface = 'light',
    collapsed = false,
}: {
    navigationItems: AppRoute[];
    onNavigate?: () => void;
    surface?: 'light' | 'dark';
    collapsed?: boolean;
}) {
    const getGroup = (path: string) => {
        if (['/dashboard', '/appointments', '/queue'].includes(path)) return 'Daily operations';
        if (['/doctors', '/patients'].includes(path)) return 'Clinic directory';
        return 'Administration';
    };
    const orderedItems = [...navigationItems].sort((a, b) => {
        const rank = (path: string) =>
            ['Daily operations', 'Clinic directory', 'Administration'].indexOf(getGroup(path));
        return rank(a.path) - rank(b.path);
    });
    return (
        <nav className="flex flex-col gap-1" aria-label="Clinic workspace navigation">
            {orderedItems.map((item, index) => {
                const label = item.navigationLabel ?? item.title;
                const darkSurface = surface === 'dark';
                const group = getGroup(item.path);
                const beginsGroup = index === 0 || getGroup(orderedItems[index - 1].path) !== group;

                return (
                    <div key={item.path}>
                        {beginsGroup ? (
                            <p
                                className={`${collapsed ? 'sr-only' : ''} mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] ${index === 0 ? 'mt-0' : 'mt-5'} ${darkSurface ? 'text-slate-400' : 'text-slate-500'}`}
                            >
                                {group}
                            </p>
                        ) : null}
                        <NavLink
                            to={item.path}
                            end={item.path === '/dashboard'}
                            onClick={onNavigate}
                            title={collapsed ? label : item.navigationDescription}
                            aria-label={collapsed ? label : undefined}
                            className={({ isActive }) =>
                                `workspace-nav-link ${collapsed ? 'is-compact' : ''} group relative flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
                                    isActive
                                        ? darkSurface
                                            ? 'bg-white/10 text-white'
                                            : 'bg-slate-950 text-white shadow-sm'
                                        : darkSurface
                                          ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive ? (
                                        <motion.span
                                            layoutId={`workspace-active-indicator-${surface}`}
                                            transition={{ duration: 0.18 }}
                                            className="absolute left-1 h-6 w-1 rounded-full bg-brand"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <span
                                            className="absolute left-1 h-6 w-1 rounded-full bg-transparent"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <span
                                        className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                                            isActive
                                                ? darkSurface
                                                    ? 'bg-brand text-slate-950'
                                                    : 'bg-white/10 text-brand'
                                                : darkSurface
                                                  ? 'bg-white/5 text-slate-400 group-hover:text-slate-100'
                                                  : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                                        }`}
                                    >
                                        <NavigationIcon name={item.navigationIcon} />
                                    </span>
                                    <span className={collapsed ? 'sr-only' : 'min-w-0 truncate'}>
                                        {label}
                                        <span className="sr-only">
                                            , {item.navigationDescription}
                                        </span>
                                    </span>
                                </>
                            )}
                        </NavLink>
                    </div>
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
            triggerButtonRef.current?.focus({ preventScroll: true });
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
            const closeTimer = window.setTimeout(() => closeMenu(false), 0);

            return () => {
                window.clearTimeout(closeTimer);
            };
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
        const workspace = document.querySelector<HTMLElement>('[data-workspace-scroll-container]');
        const previousWorkspaceOverflow = workspace?.style.overflow;
        if (workspace) workspace.style.overflow = 'hidden';
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
            if (workspace) workspace.style.overflow = previousWorkspaceOverflow ?? '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeMenu, isOpen]);

    return (
        <div className="border-b border-slate-200 bg-white md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <PravaahLogoLink layout="horizontal" surface="light" size="sm" />
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

            <AnimatePresence initial={false}>
                {isOpen
                    ? [
                          <motion.button
                              key="mobile-navigation-overlay"
                              type="button"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="fixed inset-0 z-50 bg-slate-950/40 md:hidden"
                              aria-label="Dismiss clinic navigation overlay"
                              onClick={() => closeMenu()}
                          />,
                          <motion.aside
                              key="mobile-navigation-drawer"
                              initial={{ x: '-100%' }}
                              animate={{ x: 0 }}
                              exit={{ x: '-100%' }}
                              transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                              ref={drawerRef}
                              id="mobile-workspace-navigation"
                              role="dialog"
                              aria-modal="true"
                              inert={!isOpen}
                              className="fixed inset-y-0 left-0 z-[51] flex w-[min(22rem,calc(100vw-2rem))] flex-col md:hidden overflow-y-auto border-r border-slate-200 bg-white shadow-xl"
                              aria-label="Clinic workspace navigation menu"
                              tabIndex={-1}
                          >
                              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
                                  <div className="min-w-0">
                                      <PravaahLogoLink
                                          layout="horizontal"
                                          surface="light"
                                          size="sm"
                                          onNavigate={() => closeMenu(false)}
                                      />
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
                                      onNavigate={() => {
                                          closeMenu(false);
                                          document
                                              .getElementById('main-content')
                                              ?.focus({ preventScroll: true });
                                      }}
                                  />
                              </div>
                          </motion.aside>,
                      ]
                    : null}
            </AnimatePresence>
        </div>
    );
}

function Sidebar({ navigationItems, clinicName, clinicMeta }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            const preference = localStorage.getItem('pravaah.sidebar.compact');
            return preference === null
                ? typeof window.matchMedia === 'function' &&
                      window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches
                : preference === 'true';
        } catch {
            return false;
        }
    });
    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem('pravaah.sidebar.compact', String(next));
        } catch {
            /* Navigation remains usable when storage is unavailable. */
        }
    };
    return (
        <aside
            className={`workspace-sidebar ${collapsed ? 'is-compact' : ''}`}
            aria-label="Workspace sidebar"
        >
            <div className="workspace-sidebar-brand">
                <PravaahLogoLink
                    layout={collapsed ? 'mark' : 'horizontal'}
                    surface="dark"
                    size="md"
                />
                {!collapsed && (
                    <span className="mt-1 block text-[11px] font-medium tracking-wide text-slate-400">
                        CLINIC WORKSPACE
                    </span>
                )}
            </div>
            <div className="workspace-clinic" title={clinicName}>
                <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-teal-200"
                >
                    {clinicName.slice(0, 1).toUpperCase()}
                </span>
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{clinicName}</p>
                        <p className="truncate text-xs text-slate-400">{clinicMeta}</p>
                    </div>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-5">
                <WorkspaceNavigation
                    navigationItems={navigationItems}
                    surface="dark"
                    collapsed={collapsed}
                />
            </div>
            <div className="space-y-1 border-t border-white/10 p-2">
                <Link
                    to="/profile"
                    className="sidebar-footer-control"
                    title="Your account"
                    aria-label={collapsed ? 'Your account' : undefined}
                >
                    <NavigationIcon name="staff" />
                    {!collapsed && <span>Your account</span>}
                </Link>
                <button
                    type="button"
                    className="sidebar-footer-control"
                    onClick={toggleSidebar}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                    >
                        <rect x="3" y="4" width="18" height="16" rx="3" />
                        <path d="M9 4v16" />
                        <path d={collapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'} />
                    </svg>
                    {!collapsed && <span>Collapse sidebar</span>}
                </button>
            </div>
        </aside>
    );
}

export { MobileWorkspaceNavigation };
export default Sidebar;
