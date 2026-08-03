import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import Button from './Button';

describe('Button', () => {
    it('disables interaction and exposes loading text while loading', () => {
        renderWithProviders(
            <Button isLoading loadingText="Saving changes">
                Save
            </Button>
        );

        expect(screen.getByRole('button', { name: /saving changes/i })).toBeDisabled();
    });

    it('defaults to a non-submit button to avoid accidental form submissions', () => {
        renderWithProviders(<Button>Refresh</Button>);

        expect(screen.getByRole('button', { name: /refresh/i })).toHaveAttribute(
            'type',
            'button'
        );
    });
});
