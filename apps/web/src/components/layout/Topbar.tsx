import { useClerk } from '@clerk/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { appRoutePaths } from '../../routes/dashboardRoutes';

type TopbarProps = {
    title: string;
    supportingText?: string;
    clinicName: string;
    userName: string;
    userEmail?: string;
    userRole: string;
};

const getInitials = (name: string): string => {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return initials || 'P';
};

function Topbar({ clinicName, supportingText, title, userName, userEmail, userRole }: TopbarProps) {
    const { signOut } = useClerk();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const userInitials = getInitials(userName);

    useEffect(() => {
        if (!isMenuOpen) {
            return undefined;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsMenuOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

    useEffect(() => {
        const closeTimer = window.setTimeout(() => setIsMenuOpen(false), 0);

        return () => window.clearTimeout(closeTimer);
    }, [location.key]);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut({ redirectUrl: '/' });
            setIsMenuOpen(false);
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <header className="relative z-40 shrink-0 border-b border-slate-200/80 bg-white/95 px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur md:px-6">
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
                aria-hidden="true"
            />
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 text-white shadow-[0_6px_16px_rgba(20,184,166,0.24)] sm:flex"
                        aria-hidden="true"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 12h4l2-7 4 14 2-7h4" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            <span className="shrink-0 text-brand-foreground">Workspace</span>
                            <span
                                className="h-1 w-1 shrink-0 rounded-full bg-brand"
                                aria-hidden="true"
                            />
                            <span className="truncate normal-case tracking-normal text-slate-500">
                                Clinic workspace
                            </span>
                        </div>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            <h1 className="truncate text-xl font-bold leading-none tracking-tight text-slate-950 sm:text-2xl">
                                {title}
                            </h1>
                            {supportingText ? (
                                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-slate-500 ring-1 ring-slate-200/80">
                                    <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{supportingText}</span>
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2">
                    <span className="hidden min-h-9 items-center rounded-full bg-brand-subtle px-3 text-sm font-semibold text-brand-foreground ring-1 ring-brand-soft sm:inline-flex">
                        {userRole}
                    </span>

                    <div ref={menuRef} className="relative">
                        <button
                            ref={triggerRef}
                            type="button"
                            className="flex min-h-10 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                            aria-controls="workspace-user-menu"
                            onClick={() => setIsMenuOpen((current) => !current)}
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                                {userInitials}
                            </span>
                            <span className="max-w-[10rem] truncate">{userName}</span>
                        </button>
                        <AnimatePresence initial={false}>
                            {isMenuOpen ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.16 }}
                                    id="workspace-user-menu"
                                    role="menu"
                                    className="setup-dock-enter absolute right-0 top-12 z-[60] w-[min(18rem,calc(100vw-2rem))] min-w-60 rounded-lg bg-white p-2 shadow-[var(--shadow-command)] ring-1 ring-slate-200"
                                >
                                    <div className="px-3 py-2">
                                        <p className="truncate text-sm font-semibold text-slate-950">
                                            {userName}
                                        </p>
                                        {userEmail ? (
                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                {userEmail}
                                            </p>
                                        ) : null}
                                        <dl className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs">
                                            <div>
                                                <dt className="font-semibold uppercase tracking-wide text-slate-500">
                                                    Role
                                                </dt>
                                                <dd className="mt-0.5 font-semibold text-brand-foreground">
                                                    {userRole}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold uppercase tracking-wide text-slate-500">
                                                    Clinic
                                                </dt>
                                                <dd className="mt-0.5 break-words font-medium text-slate-700">
                                                    {clinicName}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                    <Link
                                        to={appRoutePaths.profile}
                                        role="menuitem"
                                        className="mt-1 inline-flex min-h-10 w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="mt-1 inline-flex min-h-10 w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[var(--color-status-danger-bg)] hover:text-[var(--color-status-danger-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-wait disabled:opacity-70"
                                        disabled={isSigningOut}
                                        onClick={() => void handleSignOut()}
                                    >
                                        {isSigningOut ? 'Signing out...' : 'Sign out'}
                                    </button>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Topbar;
