import { SignOutButton } from '@clerk/react';

type TopbarProps = {
    title: string;
    eyebrow?: string;
    userName: string;
    userEmail?: string;
    userRole: string;
    clinicTimezone?: string | null;
};

function Topbar({
    title,
    eyebrow = 'Clinic Operations',
    userName,
    userEmail,
    userRole,
    clinicTimezone,
}: TopbarProps) {
    return (
        <header className="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                        {eyebrow}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Viewing {title}</p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
                    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                        {clinicTimezone ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-xs font-medium text-slate-500">Clinic time</p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                                    {clinicTimezone}
                                </p>
                            </div>
                        ) : null}

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium text-slate-500">Signed in</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                                {userName}
                            </p>
                            {userEmail ? (
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {userEmail}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="inline-flex min-h-10 items-center rounded-full bg-teal-50 px-3 text-sm font-semibold text-teal-800 ring-1 ring-teal-200">
                            {userRole}
                        </span>

                        <SignOutButton>
                            <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                            >
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <path d="m16 17 5-5-5-5" />
                                    <path d="M21 12H9" />
                                </svg>
                                Sign out
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Topbar;
