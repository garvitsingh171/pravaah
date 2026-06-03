import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="flex min-h-screen">
                <Sidebar />

                <div className="flex min-h-screen flex-1 flex-col">
                    <Topbar />

                    <main className="flex-1 p-6">
                        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8">
                            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                                Base Layout Shell
                            </p>

                            <h1 className="mt-3 text-3xl font-bold text-slate-900">
                                Pravaah frontend foundation is ready
                            </h1>

                            <p className="mt-4 max-w-2xl text-slate-600">
                                This main content area will later hold clinic staff workflows such as dashboard, clinic settings, doctor management, patient management, appointments, and queue screens.
                            </p>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default AppLayout;