import { SignOutButton } from '@clerk/react';

type TopbarProps = {
    title: string;
    eyebrow?: string;
    userContext?: string;
};

function Topbar({ title, eyebrow = 'Clinic Workspace', userContext = 'Staff Area' }: TopbarProps) {
    return (
        <header className="flex min-h-16 flex-col items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center md:px-6">
            <div className="min-w-0">
                <p className="text-sm text-slate-500">{eyebrow}</p>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <div className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                    {userContext}
                </div>

                <SignOutButton redirectUrl="/login?signout=success">
                    <button
                        type="button"
                        className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Sign out
                    </button>
                </SignOutButton>
            </div>
        </header>
    );
}

export default Topbar;
