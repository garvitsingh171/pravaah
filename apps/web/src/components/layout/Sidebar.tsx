const navigationItems = [
    'Dashboard',
    'Clinic',
    'Patients',
    'Appointments',
    'Doctors',
    'Queue',
]

function Sidebar() {
    return (
        <aside className="hidden min-h-screen w-64 border-r border-slate-200 bg-white px-4 py-6 md:block">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Pravaah
                </p>
                <h1 className="mt-2 text-xl font-bold text-slate-900">
                    Clinic Flow
                </h1>
            </div>

            <nav>
                {navigationItems.map((item) => (
                    <button key={item} type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                        {item}
                    </button>
                ))}
            </nav>
        </aside>
    )
}

export default Sidebar;