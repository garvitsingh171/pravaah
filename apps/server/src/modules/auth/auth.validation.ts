import { z } from 'zod';
import { createClinicSchema } from '../clinics/clinic.validation.js';

export const onboardingClinicSchema = createClinicSchema;

export type OnboardingClinicSchemaInput = z.infer<typeof onboardingClinicSchema>;
