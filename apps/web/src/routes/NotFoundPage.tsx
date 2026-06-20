function NotFoundPage() {
    return (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 md:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Not Found</p>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">Page Not Found</h1>

            <p className="mt-4 max-w-2xl text-slate-600">
                The requested page does not exist in the Pravaah MVP route structure.
            </p>
        </section>
    );
}

export default NotFoundPage;
