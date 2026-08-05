import type { ReactNode } from 'react';

type PageHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
};

function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
    return (
        <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-app-border bg-white p-4 sm:p-6 md:flex-row md:items-start md:justify-between md:p-8">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                        {eyebrow}
                    </p>
                ) : null}
                <h1
                    className={
                        eyebrow
                            ? 'mt-3 break-words text-2xl font-bold leading-tight text-app-text sm:text-3xl'
                            : 'break-words text-2xl font-bold leading-tight text-app-text sm:text-3xl'
                    }
                >
                    {title}
                </h1>
                {description ? (
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-app-muted sm:text-base">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex w-full shrink-0 flex-col gap-2 [&>*]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end sm:[&>*]:w-auto">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}

export default PageHeader;
