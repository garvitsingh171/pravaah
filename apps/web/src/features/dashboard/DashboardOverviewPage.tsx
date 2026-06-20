import { ErrorMessage, LoadingState } from '../../components/feedback';

function DashboardOverviewPage() {
    return (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 md:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Dashboard</p>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">Dashboard Overview</h1>

            <p className="mt-4 max-w-2xl text-slate-600">
                Placeholder page for the clinic overview. Future work can add appointment counts,
                queue activity, completed visits, and high-risk appointment summaries here.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <LoadingState message="Loading dashboard summary..." />

                <ErrorMessage
                    title="Dashboard data unavailable"
                    message="Backend errors will be shown here when dashboard requests fail."
                    code="DASHBOARD_REQUEST_FAILED"
                />
            </div>
        </section>
    );
}

export default DashboardOverviewPage;
