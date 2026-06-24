/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_CLERK_PUBLISHABLE_KEY: string;
    readonly VITE_DEFAULT_CLINIC_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
