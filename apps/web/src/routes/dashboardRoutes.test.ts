import { describe, expect, it } from 'vitest';
import { UserRole } from '../types';
import { getNavigationRoutesForRole } from './dashboardRoutes';

describe('workspace navigation access', () => {
    it('only lists management routes for admins', () => {
        const anonymousPaths = getNavigationRoutesForRole(null).map((route) => route.path);
        const staffPaths = getNavigationRoutesForRole(UserRole.STAFF).map((route) => route.path);
        const adminPaths = getNavigationRoutesForRole(UserRole.ADMIN).map((route) => route.path);

        expect(anonymousPaths).not.toContain('/staff');
        expect(anonymousPaths).not.toContain('/clinic-settings');
        expect(staffPaths).not.toContain('/staff');
        expect(staffPaths).not.toContain('/clinic-settings');
        expect(adminPaths).toContain('/staff');
        expect(adminPaths).toContain('/clinic-settings');
    });
});
