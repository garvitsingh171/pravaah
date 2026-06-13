import { prisma } from '../../config/prisma.js';
import { AppointmentStatus } from '../../generated/prisma/client.js';
import type { CreateAppointmentInput } from './appointment.types.js';

export const appointmentRepository = {
    findClinicById(clinicId: string) {
        return prisma.clinic.findUnique({
            where: {
                id: clinicId,
            },
        });
    },

    findAppointmentsByClinicId(clinicId: string) {
        return prisma.appointment.findMany({
            where: {
                clinicId,
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        fullName: true,
                        specialization: true,
                        qualification: true,
                        registrationNumber: true,
                        phone: true,
                        email: true,
                        gender: true,
                        experienceYears: true,
                        isActive: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        gender: true,
                        dateOfBirth: true,
                        age: true,
                        address: true,
                        city: true,
                        emergencyContactName: true,
                        emergencyContactPhone: true,
                        isActive: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
                queueEntry: {
                    select: {
                        id: true,
                        position: true,
                        status: true,
                        queuedAt: true,
                        calledAt: true,
                        completedAt: true,
                    },
                },
            },
            orderBy: {
                scheduledAt: 'asc',
            },
        });
    },

    findDoctorById(doctorId: string) {
        return prisma.doctor.findUnique({
            where: {
                id: doctorId,
            },
        });
    },

    findPatientById(patientId: string) {
        return prisma.patient.findUnique({
            where: {
                id: patientId,
            },
        });
    },

    findActiveDoctorClinicLink(clinicId: string, doctorId: string) {
        return prisma.doctorClinic.findFirst({
            where: {
                clinicId,
                doctorId,
                isActive: true,
            },
        });
    },

    findActivePatientClinicLink(clinicId: string, patientId: string) {
        return prisma.patientClinic.findFirst({
            where: {
                clinicId,
                patientId,
                isActive: true,
            },
        });
    },

    findDoctorAppointmentAtTime(
        clinicId: string,
        doctorId: string,
        scheduledAt: Date,
        statuses: AppointmentStatus[]
    ) {
        return prisma.appointment.findFirst({
            where: {
                clinicId,
                doctorId,
                scheduledAt,
                status: {
                    in: statuses,
                },
            },
        });
    },

    create(clinicId: string, createdByUserId: string, data: CreateAppointmentInput) {
        return prisma.appointment.create({
            data: {
                clinicId,
                doctorId: data.doctorId,
                patientId: data.patientId,
                scheduledAt: new Date(data.scheduledAt),
                durationMinutes: data.durationMinutes,
                status: AppointmentStatus.SCHEDULED,
                reason: data.reason ?? null,
                notes: data.notes ?? null,
                bookingSource: data.bookingSource,
                createdByUserId,
            },
        });
    },
};
