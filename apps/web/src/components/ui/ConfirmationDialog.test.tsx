import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ConfirmationDialog from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
    it('locks and restores the workspace scroll container while open', async () => {
        const workspace = document.createElement('main');
        workspace.dataset.workspaceScrollContainer = 'true';
        workspace.style.overflow = 'auto';
        document.body.appendChild(workspace);

        const { rerender, unmount } = render(
            <ConfirmationDialog
                open
                title="Delete record?"
                description="This cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />
        );

        expect(workspace.style.overflow).toBe('hidden');

        rerender(
            <ConfirmationDialog
                open={false}
                title="Delete record?"
                description="This cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={() => undefined}
                onCancel={() => undefined}
            />
        );

        await waitFor(() => expect(workspace.style.overflow).toBe('auto'));

        unmount();
        workspace.remove();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
