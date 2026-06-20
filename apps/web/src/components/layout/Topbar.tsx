type TopbarProps = {
    title: string;
    eyebrow?: string;
    userContext?: string;
};

function Topbar({ title, eyebrow = 'Clinic Workspace', userContext = 'Staff Area' }: TopbarProps) {
    return (
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div>
                <p className="text-sm text-slate-500">{eyebrow}</p>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>

            <div className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {userContext}
            </div>
        </header>
    );
}

export default Topbar;
