import type { RequestHandler, Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../config/prisma.js', () => ({ prisma: {} }));
vi.mock('../../../config/env.js', () => ({
    env: { clientUrl: 'https://app.pravaah.test' },
}));

import { staffInvitationRouter, staffRouter } from '../staff.routes.js';

type InspectableRoute = {
    path: string;
    methods: Record<string, boolean | undefined>;
    stack: Array<{ handle: RequestHandler & { name?: string } }>;
};

const getRoute = (router: Router, method: string, path: string): InspectableRoute => {
    const stack = (router as unknown as { stack: Array<{ route?: InspectableRoute }> }).stack;
    const route = stack
        .map((layer) => layer.route)
        .find((candidate) => candidate?.path === path && candidate.methods[method]);

    if (!route) throw new Error(`Route ${method.toUpperCase()} ${path} was not found`);
    return route;
};

const handlerNames = (route: InspectableRoute): string[] =>
    route.stack.map((layer) => layer.handle.name ?? 'anonymous');

describe('staff routes', () => {
    it.each([
        ['get', '/:clinicId/staff'],
        ['patch', '/:clinicId/staff/:userId/status'],
        ['get', '/:clinicId/staff/invitations'],
        ['post', '/:clinicId/staff/invitations'],
        ['patch', '/:clinicId/staff/invitations/:invitationId/revoke'],
    ])('protects %s %s with active Admin and clinic access', (method, path) => {
        const names = handlerNames(getRoute(staffRouter, method, path));

        expect(names[0]).toBe('authenticateRequest');
        expect(names[1]).toBe('requireAdminRole');
        expect(names).toContain('requireClinicAccess');
    });

    it.each([
        ['get', '/invitations/:token'],
        ['post', '/invitations/:token/accept'],
    ])('uses Clerk-only authentication for %s %s', (method, path) => {
        const names = handlerNames(getRoute(staffInvitationRouter, method, path));

        expect(names[0]).toBe('authenticateClerkIdentity');
        expect(names).not.toContain('authenticateRequest');
    });
});
