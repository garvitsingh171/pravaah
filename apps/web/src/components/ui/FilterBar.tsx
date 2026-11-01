import type { HTMLAttributes } from 'react';
import { cx } from './classNames';

function FilterBar({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={cx(
                'workspace-filter-bar rounded-app-lg border border-app-border bg-app-surface p-4',
                className
            )}
        >
            {children}
        </div>
    );
}

export default FilterBar;
