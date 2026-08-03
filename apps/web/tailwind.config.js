/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: 'var(--color-brand)',
                'brand-hover': 'var(--color-brand-hover)',
                'brand-soft': 'var(--color-brand-soft)',
                'brand-subtle': 'var(--color-brand-subtle)',
                'brand-foreground': 'var(--color-brand-foreground)',
                action: 'var(--color-action)',
                'action-hover': 'var(--color-action-hover)',
                'action-soft': 'var(--color-action-soft)',
                app: {
                    background: 'var(--color-app-background)',
                    surface: 'var(--color-app-surface)',
                    'surface-muted': 'var(--color-app-surface-muted)',
                    border: 'var(--color-app-border)',
                    'border-strong': 'var(--color-app-border-strong)',
                    text: 'var(--color-app-text)',
                    muted: 'var(--color-app-text-muted)',
                    subtle: 'var(--color-app-text-subtle)',
                },
            },
            borderRadius: {
                app: 'var(--radius-app-md)',
            },
        },
    },
    plugins: [],
};
