import type { ReactNode } from 'react';

type PageHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
};

function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 rounded-lg border border-app-border bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
            <div>
                {eyebrow ? (
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                        {eyebrow}
                    </p>
                ) : null}
                <h1
                    className={
                        eyebrow
                            ? 'mt-3 text-3xl font-bold text-app-text'
                            : 'text-3xl font-bold text-app-text'
                    }
                >
                    {title}
                </h1>
                {description ? (
                    <p className="mt-4 max-w-2xl text-app-muted">{description}</p>
                ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
    );
}

export default PageHeader;
