/// <reference types="@clerk/express/env" />

import type { AuthenticatedUser, ClerkIdentity } from '../modules/auth/auth.types.js';

declare global {
    namespace Express {
        interface Request {
            authIdentity?: ClerkIdentity;
            user?: AuthenticatedUser;
        }
    }
}

export {};
