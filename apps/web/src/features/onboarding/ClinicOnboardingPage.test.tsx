import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClinicOnboardingPage from './ClinicOnboardingPage';
import { ApiClientError } from '../../lib';
import {
    completedAdminOnboarding,
    onboardingNotStarted,
    recoveryRequiredOnboarding,
} from '../../test/fixtures/onboarding';
import { renderWithProviders } from '../../test/renderWithProviders';
import { setClerkLoading, setClerkSignedIn, setClerkSignedOut } from '../../test/mocks/clerk';

const mockGetOnboardingStatus = vi.hoisted(() => vi.fn());
const mockCreateClinicOnboarding = vi.hoisted(() => vi.fn());
const mockProvisionSampleData = vi.hoisted(() => vi.fn());

vi.mock('./onboardingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./onboardingApi')>();

    return {
        ...actual,
        getOnboardingStatus: mockGetOnboardingStatus,
        createClinicOnboarding: mockCreateClinicOnboarding,
        provisionSampleData: mockProvisionSampleData,
    };
});

function LocationState() {
    const location = useLocation();

    return (
        <div data-testid="location">
            {location.pathname}
            {location.search}
        </div>
    );
}

function renderOnboarding(route = '/onboarding/clinic') {
    return renderWithProviders(
        <Routes>
            <Route path="/onboarding/clinic" element={<ClinicOnboardingPage />} />
            <Route path="/login" element={<LocationState />} />
            <Route path="/dashboard" element={<LocationState />} />
            <Route path="/doctors" element={<LocationState />} />
        </Routes>,
        {
            route,
        }
    );
}

const fillValidClinicForm = async () => {
    const user = userEvent.setup();
    const clinicNameInput = await screen.findByLabelText(/clinic name/i);

    await user.type(clinicNameInput, 'Pravaah Family Clinic');
    await user.type(screen.getByLabelText(/clinic phone/i), '+91 98765 43210');
    await user.type(screen.getByLabelText(/clinic email/i), 'frontdesk@example.com');
    await user.type(screen.getByLabelText(/address line 1/i), '12 Wellness Road');
    await user.type(screen.getByLabelText(/address line 2/i), 'Training District');
    await user.type(screen.getByLabelText(/^city/i), 'Mumbai');
    await user.type(screen.getByLabelText(/^state/i), 'Maharashtra');
    await user.clear(screen.getByLabelText(/^country/i));
    await user.type(screen.getByLabelText(/^country/i), 'India');
    await user.type(screen.getByLabelText(/pincode/i), '400001');
    await user.clear(screen.getByLabelText(/timezone/i));
    await user.type(screen.getByLabelText(/timezone/i), 'Asia/Kolkata');
    fireEvent.change(screen.getByLabelText(/opening time/i), { target: { value: '09:30' } });
    fireEvent.change(screen.getByLabelText(/closing time/i), { target: { value: '18:30' } });
    await user.clear(screen.getByLabelText(/slot duration minutes/i));
    await user.type(screen.getByLabelText(/slot duration minutes/i), '20');
    await user.clear(screen.getByLabelText(/buffer minutes/i));
    await user.type(screen.getByLabelText(/buffer minutes/i), '5');

    return user;
};

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        void promiseReject;
    });

    return {
        promise,
        resolve,
    };
}

describe('ClinicOnboardingPage', () => {
    beforeEach(() => {
        mockGetOnboardingStatus.mockReset();
        mockCreateClinicOnboarding.mockReset();
        mockProvisionSampleData.mockReset();
    });

    it('shows loading while Clerk loads and redirects signed-out users to login', async () => {
        setClerkLoading();

        const { unmount } = renderOnboarding();

        expect(screen.getByText('Preparing clinic onboarding...')).toBeInTheDocument();
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();

        unmount();
        setClerkSignedOut();
        renderOnboarding();

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent(
                '/login?redirect_url=%2Fonboarding%2Fclinic'
            );
        });
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });

    it('renders the first-time clinic form with the implemented fields', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);

        renderOnboarding();

        expect(
            await screen.findByRole('heading', { name: /create your clinic workspace/i })
        ).toBeInTheDocument();

        [
            /clinic name/i,
            /clinic slug/i,
            /clinic phone/i,
            /clinic email/i,
            /address line 1/i,
            /address line 2/i,
            /^city/i,
            /^state/i,
            /^country/i,
            /pincode/i,
            /timezone/i,
            /opening time/i,
            /closing time/i,
            /slot duration minutes/i,
            /buffer minutes/i,
        ].forEach((label) => {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        });
    });

    it('redirects completed users away from onboarding using only safe application targets', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderOnboarding('/onboarding/clinic?redirect_url=https%3A%2F%2Fevil.example%2Fsteal');

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
        });
    });

    it('shows recovery UI for recovery-required status', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(recoveryRequiredOnboarding);

        renderOnboarding();

        expect(await screen.findByText('Account needs recovery')).toBeInTheDocument();
        expect(screen.getByText('RECOVERY_REQUIRED')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /create clinic workspace/i })
        ).not.toBeInTheDocument();
    });

    it('shows status load failures and retries successfully', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'API_NETWORK_ERROR',
                    message: 'Could not reach the Pravaah API.',
                })
            )
            .mockResolvedValueOnce(onboardingNotStarted);

        renderOnboarding();

        expect(await screen.findByText('Onboarding could not be loaded')).toBeInTheDocument();
        expect(screen.getByText('API_NETWORK_ERROR')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /try again/i }));

        expect(
            await screen.findByRole('heading', { name: /create your clinic workspace/i })
        ).toBeInTheDocument();
        expect(mockGetOnboardingStatus).toHaveBeenCalledTimes(2);
    });

    it('validates required and shaped fields before calling the provisioning API', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);

        renderOnboarding();

        await screen.findByRole('heading', { name: /create your clinic workspace/i });
        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(screen.getByText('Clinic name is required.')).toBeInTheDocument();
        expect(screen.getByText('Clinic slug is required.')).toBeInTheDocument();
        expect(mockCreateClinicOnboarding).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText(/clinic name/i), 'A');
        await user.clear(screen.getByLabelText(/clinic slug/i));
        await user.type(screen.getByLabelText(/clinic slug/i), 'b');
        await user.type(screen.getByLabelText(/clinic email/i), 'not-email');
        fireEvent.change(screen.getByLabelText(/opening time/i), { target: { value: '25:99' } });
        fireEvent.change(screen.getByLabelText(/closing time/i), { target: { value: 'bad' } });
        await user.clear(screen.getByLabelText(/slot duration minutes/i));
        await user.type(screen.getByLabelText(/slot duration minutes/i), '0');
        await user.clear(screen.getByLabelText(/buffer minutes/i));
        await user.type(screen.getByLabelText(/buffer minutes/i), '-1');

        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(
            screen.getByText('Clinic name must be at least 2 characters long.')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Clinic slug must be at least 2 characters long.')
        ).toBeInTheDocument();
        expect(screen.getByText('Enter a valid clinic email address.')).toBeInTheDocument();
        expect(
            screen.getByText('Slot duration must be a whole number greater than 0.')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Buffer minutes must be a whole number greater than or equal to 0.')
        ).toBeInTheDocument();
        expect(mockCreateClinicOnboarding).not.toHaveBeenCalled();
    });

    it.each([
        [
            'slot duration',
            /slot duration minutes/i,
            '2.5',
            'Slot duration must be a whole number greater than 0.',
        ],
        [
            'slot duration',
            /slot duration minutes/i,
            '-5',
            'Slot duration must be a whole number greater than 0.',
        ],
        [
            'buffer minutes',
            /buffer minutes/i,
            '1.5',
            'Buffer minutes must be a whole number greater than or equal to 0.',
        ],
        [
            'buffer minutes',
            /buffer minutes/i,
            '-1',
            'Buffer minutes must be a whole number greater than or equal to 0.',
        ],
    ])('rejects invalid %s numeric values', async (_name, label, value, message) => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);

        renderOnboarding();

        await fillValidClinicForm();
        await user.clear(screen.getByLabelText(label));
        await user.type(screen.getByLabelText(label), value);
        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(screen.getByText(message)).toBeInTheDocument();
        expect(mockCreateClinicOnboarding).not.toHaveBeenCalled();
    });

    it('generates a slug from clinic name until the user edits the slug', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);

        renderOnboarding();

        const nameInput = await screen.findByLabelText(/clinic name/i);
        const slugInput = screen.getByLabelText(/clinic slug/i);

        await user.type(nameInput, 'Pravaah Family Clinic');

        expect(slugInput).toHaveValue('pravaah-family-clinic');

        await user.clear(slugInput);
        await user.type(slugInput, 'customclinic');
        await user.clear(nameInput);
        await user.type(nameInput, 'Another Clinic');

        expect(slugInput).toHaveValue('customclinic');
    });

    it('submits only supported clinic fields and never authority fields', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);
        mockCreateClinicOnboarding.mockResolvedValue(completedAdminOnboarding);

        const user = await fillAfterRender();

        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        await waitFor(() => {
            expect(mockCreateClinicOnboarding).toHaveBeenCalledTimes(1);
        });

        const payload = mockCreateClinicOnboarding.mock.calls[0][0];

        expect(payload).toEqual({
            name: 'Pravaah Family Clinic',
            slug: 'pravaah-family-clinic',
            phone: '+91 98765 43210',
            email: 'frontdesk@example.com',
            addressLine1: '12 Wellness Road',
            addressLine2: 'Training District',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400001',
            timezone: 'Asia/Kolkata',
            openingTime: '09:30',
            closingTime: '18:30',
            slotDurationMinutes: 20,
            bufferMinutes: 5,
        });
        [
            'clerkUserId',
            'userId',
            'role',
            'status',
            'clinicId',
            'ownerId',
            'existingClinicOwnership',
        ].forEach((field) => {
            expect(payload).not.toHaveProperty(field);
        });
    });

    it('blocks duplicate provisioning while the first request is pending', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);
        const pendingProvisioning = deferred<typeof completedAdminOnboarding>();
        mockCreateClinicOnboarding.mockReturnValue(pendingProvisioning.promise);

        const user = await fillAfterRender();
        const submitButton = screen.getByRole('button', { name: /create clinic workspace/i });

        await user.click(submitButton);
        await user.click(submitButton);

        expect(await screen.findByRole('button', { name: /creating clinic/i })).toBeDisabled();
        expect(screen.getByLabelText(/clinic name/i)).toBeDisabled();
        expect(mockCreateClinicOnboarding).toHaveBeenCalledTimes(1);

        pendingProvisioning.resolve(completedAdminOnboarding);

        expect(
            await screen.findByRole('heading', { name: /add fictional sample data/i })
        ).toBeInTheDocument();
    });

    it('maps backend validation and slug conflict errors to fields without losing entered values', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);
        mockCreateClinicOnboarding.mockRejectedValue(
            new ApiClientError({
                code: 'CLINIC_SLUG_ALREADY_EXISTS',
                message: 'Clinic slug already exists',
                status: 409,
                details: [
                    {
                        field: 'body.name',
                        message: 'Clinic name must be at least 2 characters long',
                    },
                    {
                        field: 'body.unknown',
                        message: 'Unknown detail should not crash',
                    },
                ],
            })
        );

        const user = await fillAfterRender();
        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(await screen.findByText('Clinic was not created')).toBeInTheDocument();
        expect(screen.getByText('CLINIC_SLUG_ALREADY_EXISTS')).toBeInTheDocument();
        expect(
            screen.getAllByText('Clinic name must be at least 2 characters long').length
        ).toBeGreaterThan(0);
        expect(screen.getAllByText('Clinic slug already exists').length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/clinic name/i)).toHaveValue('Pravaah Family Clinic');
    });

    it('keeps form values after network failure and allows successful retry', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);
        mockCreateClinicOnboarding
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'API_NETWORK_ERROR',
                    message: 'Could not reach the Pravaah API.',
                })
            )
            .mockResolvedValueOnce(completedAdminOnboarding);

        const user = await fillAfterRender();

        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(await screen.findByText('Clinic was not created')).toBeInTheDocument();
        expect(screen.getByLabelText(/clinic name/i)).toHaveValue('Pravaah Family Clinic');

        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(
            await screen.findByRole('heading', { name: /add fictional sample data/i })
        ).toBeInTheDocument();
        expect(mockCreateClinicOnboarding).toHaveBeenCalledTimes(2);
    });

    it('handles successful provisioning, sample-data decline, and safe routing', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);
        mockCreateClinicOnboarding.mockResolvedValue(completedAdminOnboarding);

        const user = await fillAfterRender('/onboarding/clinic?redirect_url=%2Fdoctors');

        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));

        expect(await screen.findByText(/Pravaah Test Clinic is ready/i)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /continue with an empty clinic/i }));

        expect(screen.getByTestId('location')).toHaveTextContent('/doctors');
        expect(mockProvisionSampleData).not.toHaveBeenCalled();
    });

    it('provisions sample data once, treats already-provisioned as success, and retries failures', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);
        mockCreateClinicOnboarding.mockResolvedValue(completedAdminOnboarding);
        mockProvisionSampleData
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'SAMPLE_DATA_FAILED',
                    message: 'Sample data could not be added.',
                })
            )
            .mockResolvedValueOnce({
                outcome: 'ALREADY_PROVISIONED',
                summary: {
                    doctors: 3,
                    patients: 6,
                    appointments: 9,
                    noShowPredictions: 9,
                    queueEntries: 6,
                    todayQueueEntries: 6,
                    today: '2026-07-29',
                },
            });

        const user = await fillAfterRender();

        await user.click(screen.getByRole('button', { name: /create clinic workspace/i }));
        await user.click(await screen.findByRole('button', { name: /add fictional sample data/i }));

        expect(await screen.findByText('Sample data was not added')).toBeInTheDocument();
        expect(screen.getByText('SAMPLE_DATA_FAILED')).toBeInTheDocument();
        expect(screen.getByText(/Pravaah Test Clinic is ready/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /add fictional sample data/i }));

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
        });
        expect(mockProvisionSampleData).toHaveBeenCalledWith(completedAdminOnboarding.clinic!.id);
        expect(mockProvisionSampleData).toHaveBeenCalledTimes(2);
    });
});

async function fillAfterRender(route?: string) {
    setClerkSignedIn();
    renderOnboarding(route);
    await screen.findByRole('heading', { name: /create your clinic workspace/i });

    return fillValidClinicForm();
}
