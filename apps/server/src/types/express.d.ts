/// <reference types="@clerk/express/env" />

import type { AuthenticatedUser } from '../modules/auth/auth.types.js';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};
