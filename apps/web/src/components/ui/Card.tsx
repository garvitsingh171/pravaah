import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './classNames';

type CardProps = HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: string;
    actions?: ReactNode;
};

function Card({ actions, children, className, description, title, ...cardProps }: CardProps) {
    return (
        <div
            {...cardProps}
            className={cx(
                'workspace-card rounded-app-lg border border-app-border bg-app-surface p-4 sm:p-5 shadow-sm',
                className
            )}
        >
            {title || description || actions ? (
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        {title ? (
                            <h2 className="text-base font-semibold text-app-text">{title}</h2>
                        ) : null}
                        {description ? (
                            <p className="mt-1 max-w-2xl text-sm text-app-muted">{description}</p>
                        ) : null}
                    </div>
                    {actions ? (
                        <div className="flex flex-wrap items-center gap-2">{actions}</div>
                    ) : null}
                </div>
            ) : null}
            {children}
        </div>
    );
}

export default Card;
