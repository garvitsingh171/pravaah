import { useClerk } from '@clerk/react';
import { useEffect, useRef, useState } from 'react';

type TopbarProps = {
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

function Topbar({ clinicName, userName, userEmail, userRole }: TopbarProps) {
    const { signOut } = useClerk();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
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
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

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
        <header className="border-b border-white/70 bg-white/85 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.75)] backdrop-blur md:px-6">
            <div className="mx-auto flex w-full max-w-screen-2xl justify-end">
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <span className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full bg-slate-950 px-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
                        <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                        <span className="truncate">{clinicName}</span>
                    </span>

                    <span className="inline-flex min-h-10 items-center rounded-full bg-brand-subtle px-3 text-sm font-semibold text-brand-foreground ring-1 ring-brand-soft">
                        {userRole}
                    </span>

                    <div ref={menuRef} className="relative">
                        <button
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
                        {isMenuOpen ? (
                            <div
                                id="workspace-user-menu"
                                role="menu"
                                className="absolute right-0 top-12 z-30 w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-white p-2 shadow-[var(--shadow-command)] ring-1 ring-slate-200"
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
                                    <p className="mt-1 text-xs font-semibold text-brand-foreground">
                                        {userRole} - {clinicName}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="menuitem"
                                    className="mt-1 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-wait disabled:opacity-70"
                                    disabled={isSigningOut}
                                    onClick={() => void handleSignOut()}
                                >
                                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Topbar;
