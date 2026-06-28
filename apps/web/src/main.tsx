import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import './index.css';
import ApiAuthProvider from './app/ApiAuthProvider.tsx';
import App from './App.tsx';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const signInUrl = '/login';
const afterSignInUrl = '/dashboard';

if (!clerkPublishableKey) {
    throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not configured.');
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl={signInUrl}
            signInFallbackRedirectUrl={afterSignInUrl}
            afterSignOutUrl={signInUrl}
        >
            <ApiAuthProvider>
                <App />
            </ApiAuthProvider>
        </ClerkProvider>
    </StrictMode>
);
