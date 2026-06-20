import { NavLink } from 'react-router-dom';

export type NavigationItem = {
    title: string;
    path: string;
};

type SidebarProps = {
    navigationItems: NavigationItem[];
};

function Sidebar({ navigationItems }: SidebarProps) {
    return (
        <aside className="border-b border-slate-200 bg-white px-4 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:py-6">
            <div className="mb-5 md:mb-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Pravaah
                </p>
                <h1 className="mt-2 text-xl font-bold text-slate-900">Clinic Flow</h1>
            </div>

            <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                {navigationItems.map((item) => {
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end
                            className={({ isActive }) =>
                                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition md:w-full ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`
                            }
                        >
                            {item.title}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;
