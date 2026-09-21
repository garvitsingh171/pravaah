import { describe, expect, it } from 'vitest';
import { getSafeInternalRedirectPath } from './safeRedirect';

describe('getSafeInternalRedirectPath', () => {
    it('preserves safe internal paths including query and hash', () => {
        expect(getSafeInternalRedirectPath('/invite/token?from=auth#join', '/dashboard')).toBe(
            '/invite/token?from=auth#join'
        );
    });

    it.each([
        'https://evil.example/path',
        '//evil.example/path',
        '/\\evil.example/path',
        'javascript:alert(1)',
        'dashboard',
    ])('rejects unsafe redirect input %s', (value) => {
        expect(getSafeInternalRedirectPath(value, '/dashboard')).toBe('/dashboard');
    });
});
