import type { ReactNode } from 'react';

type PageHeaderProps = {
    eyebrow?: string;
    title?: string;
    description?: string;
    actions?: ReactNode;
};

function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
    if (!title && !description && !eyebrow) {
        if (!actions) {
            return null;
        }

        return (
            <div className="flex min-w-0 justify-end">
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
                    {actions}
                </div>
            </div>
        );
    }

    return (
        <div className="workspace-page-header">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                        {eyebrow}
                    </p>
                ) : null}
                {title ? (
                    <h1
                        className={
                            eyebrow
                                ? 'mt-2 break-words text-2xl font-semibold leading-tight tracking-tight text-app-text'
                                : 'break-words text-2xl font-semibold leading-tight tracking-tight text-app-text'
                        }
                    >
                        {title}
                    </h1>
                ) : null}
                {description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">{description}</p>
                ) : null}
            </div>
            {actions ? <div className="workspace-page-actions">{actions}</div> : null}
        </div>
    );
}

export default PageHeader;
