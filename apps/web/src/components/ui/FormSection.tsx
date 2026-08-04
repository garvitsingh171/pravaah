import type { ReactNode } from 'react';

type FormSectionProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

function FormSection({ title, description, children }: FormSectionProps) {
    return (
        <fieldset className="space-y-4 rounded-lg border border-app-border bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-app-text">{title}</legend>
            {description ? (
                <p className="-mt-1 text-sm leading-6 text-app-muted">{description}</p>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2">{children}</div>
        </fieldset>
    );
}

export default FormSection;
