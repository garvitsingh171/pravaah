import { prisma } from '../../config/prisma.js';
import type { CreateClinicInput } from './clinic.types.js';

export const clinicRepository = {
    findBySlug(slug: string) {
        return prisma.clinic.findUnique({
            where: { slug },
        });
    },

    create(data: CreateClinicInput) {
        return prisma.clinic.create({
            data: {
                name: data.name,
                slug: data.slug,

                phone: data.phone ?? null,
                email: data.email ?? null,

                addressLine1: data.addressLine1 ?? null,
                addressLine2: data.addressLine2 ?? null,
                city: data.city ?? null,
                state: data.state ?? null,
                country: data.country,
                pincode: data.pincode ?? null,

                timezone: data.timezone,

                openingTime: data.openingTime ?? '09:00',
                closingTime: data.closingTime ?? '18:00',

                slotDurationMinutes: data.slotDurationMinutes,
                bufferMinutes: data.bufferMinutes,
            },
        });
    },
};
