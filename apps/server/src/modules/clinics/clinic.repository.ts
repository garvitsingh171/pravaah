import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export const clinicRepository = {
    findById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
            },
        });
    },

    findBySlug(slug: string) {
        return prisma.clinic.findUnique({
            where: {
                slug,
            },
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

                openingTime: data.openingTime,
                closingTime: data.closingTime,

                slotDurationMinutes: data.slotDurationMinutes,
                bufferMinutes: data.bufferMinutes,
            },
        });
    },

    update(id: string, data: UpdateClinicInput) {
        const updateData: Prisma.ClinicUpdateInput = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;

        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;

        if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1;
        if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.state !== undefined) updateData.state = data.state;
        if (data.country !== undefined) updateData.country = data.country;
        if (data.pincode !== undefined) updateData.pincode = data.pincode;

        if (data.timezone !== undefined) updateData.timezone = data.timezone;

        if (data.openingTime !== undefined) updateData.openingTime = data.openingTime;
        if (data.closingTime !== undefined) updateData.closingTime = data.closingTime;

        if (data.slotDurationMinutes !== undefined) {
            updateData.slotDurationMinutes = data.slotDurationMinutes;
        }

        if (data.bufferMinutes !== undefined) {
            updateData.bufferMinutes = data.bufferMinutes;
        }

        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        return prisma.clinic.update({
            where: {
                id,
            },
            data: updateData,
        });
    },
};
