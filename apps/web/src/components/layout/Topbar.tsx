function Topbar() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div>
                <p className="text-sm text-slate-500">Workspace</p>
                <h2 className="text-lg font-semibold text-slate-900">
                    Pravaah Dashboard
                </h2>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                Staff Area
            </div>
        </header>
    )
}

export default Topbar;