import type { HTMLAttributes } from 'react';
import { cx } from './classNames';

function FilterBar({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={cx('rounded-lg border border-app-border bg-white p-4 md:p-5', className)}
        >
            {children}
        </div>
    );
}

export default FilterBar;
