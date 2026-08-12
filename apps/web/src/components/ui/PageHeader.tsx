import type { ReactNode } from 'react';

type PageHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
};

function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
    return (
        <div className="flex min-w-0 flex-col gap-4 border-b border-app-border pb-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                        {eyebrow}
                    </p>
                ) : null}
                <h1
                    className={
                        eyebrow
                            ? 'mt-2 break-words text-2xl font-bold leading-tight text-app-text sm:text-3xl'
                            : 'break-words text-2xl font-bold leading-tight text-app-text sm:text-3xl'
                    }
                >
                    {title}
                </h1>
                {description ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted sm:text-base">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:justify-end [&>*]:w-full md:[&>*]:w-auto">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}

export default PageHeader;
