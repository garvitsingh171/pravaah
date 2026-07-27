import { prisma } from '../../config/prisma.js';
import {
    AppointmentStatus,
    BookingSource,
    Prisma,
    QueueStatus,
} from '../../generated/prisma/client.js';
import type { NoShowPredictionOutput } from '../predictions/prediction.types.js';
import {
    SAMPLE_DATA_NOTE_MARKER,
    SAMPLE_DOCTOR_REGISTRATION_PREFIX,
    addClinicDays,
    addMinutes,
    getClinicDateLabel,
    getClinicDateTime,
    getClinicTodayParts,
    sampleDoctorDefinitions,
    samplePatientDefinitions,
} from './sampleData.definitions.js';
import type {
    ProvisionSampleDataInput,
    SampleDataProvisioningRecordCounts,
    UpdateClinicInput,
} from './clinic.types.js';

type SampleAppointmentDefinition = {
    doctorIndex: number;
    patientIndex: number;
    dateOffset: number;
    time: string;
    status: AppointmentStatus;
    queueStatus: QueueStatus | null;
    queuePosition: number | null;
    reason: string;
    notes: string;
    bookingSource: BookingSource;
    bookedMinutesBefore: number;
};

type CreatedSamplePatient = {
    id: string;
    history: {
        totalAppointments: number;
        totalNoShows: number;
        totalLateArrivals: number;
        distanceFromClinicKm: string;
    };
};

const sampleAppointmentDefinitions: SampleAppointmentDefinition[] = [
    {
        doctorIndex: 0,
        patientIndex: 0,
        dateOffset: 0,
        time: '09:15',
        status: AppointmentStatus.IN_QUEUE,
        queueStatus: QueueStatus.WAITING,
        queuePosition: 1,
        reason: 'Routine follow-up',
        notes: 'Low-risk appointment in today queue.',
        bookingSource: BookingSource.RECEPTION,
        bookedMinutesBefore: 72 * 60,
    },
    {
        doctorIndex: 1,
        patientIndex: 1,
        dateOffset: 0,
        time: '09:45',
        status: AppointmentStatus.ARRIVED,
        queueStatus: QueueStatus.ARRIVED,
        queuePosition: 2,
        reason: 'Child fever review',
        notes: 'Medium-risk appointment marked arrived manually.',
        bookingSource: BookingSource.PHONE,
        bookedMinutesBefore: 5 * 60,
    },
    {
        doctorIndex: 2,
        patientIndex: 2,
        dateOffset: 0,
        time: '10:15',
        status: AppointmentStatus.CALLED,
        queueStatus: QueueStatus.CALLED,
        queuePosition: 3,
        reason: 'Follow-up consultation',
        notes: 'High-risk appointment currently called by staff.',
        bookingSource: BookingSource.RECEPTION,
        bookedMinutesBefore: 3 * 60,
    },
    {
        doctorIndex: 0,
        patientIndex: 3,
        dateOffset: 0,
        time: '10:45',
        status: AppointmentStatus.COMPLETED,
        queueStatus: QueueStatus.COMPLETED,
        queuePosition: 4,
        reason: 'Review visit',
        notes: 'Completed queue entry.',
        bookingSource: BookingSource.RECEPTION,
        bookedMinutesBefore: 4 * 24 * 60,
    },
    {
        doctorIndex: 1,
        patientIndex: 4,
        dateOffset: 0,
        time: '11:15',
        status: AppointmentStatus.CANCELLED,
        queueStatus: QueueStatus.CANCELLED,
        queuePosition: 5,
        reason: 'General consultation',
        notes: 'Cancelled queue entry. Staff made the decision manually.',
        bookingSource: BookingSource.PHONE,
        bookedMinutesBefore: 4 * 60,
    },
    {
        doctorIndex: 2,
        patientIndex: 2,
        dateOffset: 0,
        time: '11:45',
        status: AppointmentStatus.NO_SHOW,
        queueStatus: QueueStatus.NO_SHOW,
        queuePosition: 6,
        reason: 'Medication review',
        notes: 'No-show queue entry. Staff marked it manually.',
        bookingSource: BookingSource.RECEPTION,
        bookedMinutesBefore: 6 * 60,
    },
    {
        doctorIndex: 0,
        patientIndex: 5,
        dateOffset: 1,
        time: '12:00',
        status: AppointmentStatus.SCHEDULED,
        queueStatus: null,
        queuePosition: null,
        reason: 'New patient visit',
        notes: 'Tomorrow appointment.',
        bookingSource: BookingSource.WALK_IN,
        bookedMinutesBefore: 30 * 60,
    },
    {
        doctorIndex: 1,
        patientIndex: 1,
        dateOffset: 7,
        time: '15:30',
        status: AppointmentStatus.CONFIRMED,
        queueStatus: null,
        queuePosition: null,
        reason: 'Pediatric follow-up',
        notes: 'Future confirmed appointment.',
        bookingSource: BookingSource.PHONE,
        bookedMinutesBefore: 10 * 24 * 60,
    },
    {
        doctorIndex: 0,
        patientIndex: 0,
        dateOffset: -1,
        time: '16:00',
        status: AppointmentStatus.COMPLETED,
        queueStatus: null,
        queuePosition: null,
        reason: 'Past completed visit',
        notes: 'History appointment outside today queue.',
        bookingSource: BookingSource.RECEPTION,
        bookedMinutesBefore: 7 * 24 * 60,
    },
];

const sampleRecordWhere = (clinicId: string) => ({
    OR: [
        {
            doctorClinics: {
                some: {
                    clinicId,
                },
            },
            registrationNumber: {
                startsWith: SAMPLE_DOCTOR_REGISTRATION_PREFIX,
            },
        },
        {
            appointments: {
                some: {
                    clinicId,
                    notes: {
                        contains: SAMPLE_DATA_NOTE_MARKER,
                    },
                },
            },
        },
    ],
});

const countSampleRecords = async (
    tx: Prisma.TransactionClient,
    clinicId: string,
    today: string,
    clinicTimezone: string
): Promise<SampleDataProvisioningRecordCounts> => {
    const [todayRange] = await tx.$queryRaw<Array<{ start: Date; end: Date }>>`
        SELECT
            (${today}::date::timestamp AT TIME ZONE ${clinicTimezone}) AS "start",
            ((${today}::date + 1)::timestamp AT TIME ZONE ${clinicTimezone}) AS "end"
    `;

    const sampleAppointmentWhere = {
        clinicId,
        notes: {
            contains: SAMPLE_DATA_NOTE_MARKER,
        },
    } satisfies Prisma.AppointmentWhereInput;
    const todaySampleAppointmentWhere = {
        ...sampleAppointmentWhere,
        ...(todayRange
            ? {
                  scheduledAt: {
                      gte: todayRange.start,
                      lt: todayRange.end,
                  },
              }
            : {}),
    } satisfies Prisma.AppointmentWhereInput;

    const [
        doctors,
        patients,
        appointments,
        noShowPredictions,
        queueEntries,
        todayQueueEntries,
    ] = await Promise.all([
        tx.doctor.count({
            where: sampleRecordWhere(clinicId),
        }),
        tx.patientClinic.count({
            where: {
                clinicId,
                notes: {
                    contains: SAMPLE_DATA_NOTE_MARKER,
                },
            },
        }),
        tx.appointment.count({
            where: sampleAppointmentWhere,
        }),
        tx.noShowPrediction.count({
            where: {
                clinicId,
                appointment: sampleAppointmentWhere,
            },
        }),
        tx.queueEntry.count({
            where: {
                clinicId,
                appointment: sampleAppointmentWhere,
            },
        }),
        tx.queueEntry.count({
            where: {
                clinicId,
                appointment: {
                    ...todaySampleAppointmentWhere,
                },
            },
        }),
    ]);

    return {
        doctors,
        patients,
        appointments,
        noShowPredictions,
        queueEntries,
        todayQueueEntries,
    };
};

const buildSampleRegistrationNumber = (clinicId: string, index: number): string => {
    return `${SAMPLE_DOCTOR_REGISTRATION_PREFIX}-${clinicId.slice(0, 8)}-${index + 1}`;
};

const acquireSampleDataProvisioningLock = (
    tx: Prisma.TransactionClient,
    clinicId: string
): Promise<unknown> => {
    return tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
            hashtextextended(
                concat(${clinicId}, ':sample-data'),
                0
            )
        )
    `;
};

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

    provisionSampleData(
        input: ProvisionSampleDataInput,
        predictNoShowRisk: (data: {
            scheduledAt: Date;
            bookedAt: Date;
            patientNoShowCount: number;
            patientLateArrivalCount: number;
            patientCompletedAppointmentCount: number;
            distanceFromClinicKm: number | null;
        }) => NoShowPredictionOutput
    ) {
        return prisma.$transaction(async (tx) => {
            const clinic = await tx.clinic.findUnique({
                where: {
                    id: input.clinicId,
                },
                select: {
                    id: true,
                    timezone: true,
                    slotDurationMinutes: true,
                },
            });

            if (!clinic) {
                return {
                    outcome: 'CLINIC_NOT_FOUND' as const,
                    today: '',
                    summary: null,
                };
            }

            const todayParts = getClinicTodayParts(clinic.timezone);
            const today = getClinicDateLabel(todayParts);

            await acquireSampleDataProvisioningLock(tx, clinic.id);

            const existingCounts = await countSampleRecords(tx, clinic.id, today, clinic.timezone);

            if (
                existingCounts.doctors > 0 ||
                existingCounts.patients > 0 ||
                existingCounts.appointments > 0 ||
                existingCounts.queueEntries > 0 ||
                existingCounts.noShowPredictions > 0
            ) {
                return {
                    outcome: 'ALREADY_PROVISIONED' as const,
                    today,
                    summary: existingCounts,
                };
            }

            const createdDoctors: Array<{ id: string }> = [];

            for (const [index, doctor] of sampleDoctorDefinitions.entries()) {
                const createdDoctor = await tx.doctor.create({
                    data: {
                        fullName: doctor.fullName,
                        specialization: doctor.specialization,
                        qualification: doctor.qualification,
                        registrationNumber: buildSampleRegistrationNumber(clinic.id, index),
                        phone: doctor.phone,
                        email: doctor.email,
                        gender: doctor.gender,
                        experienceYears: doctor.experienceYears,
                        isActive: true,
                        doctorClinics: {
                            create: {
                                clinicId: clinic.id,
                                isActive: true,
                                displayName: doctor.displayName,
                                consultationFee: doctor.consultationFee,
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                });

                createdDoctors.push(createdDoctor);
            }

            const createdPatients: CreatedSamplePatient[] = [];

            for (const patient of samplePatientDefinitions) {
                const createdPatient = await tx.patient.create({
                    data: {
                        fullName: patient.fullName,
                        phone: patient.phone,
                        email: patient.email,
                        gender: patient.gender,
                        age: patient.age,
                        address: patient.address,
                        city: patient.city,
                        emergencyContactName: patient.emergencyContactName,
                        emergencyContactPhone: patient.emergencyContactPhone,
                        isActive: true,
                        patientClinics: {
                            create: {
                                clinicId: clinic.id,
                                totalAppointments: patient.history.totalAppointments,
                                totalNoShows: patient.history.totalNoShows,
                                totalLateArrivals: patient.history.totalLateArrivals,
                                distanceFromClinicKm: patient.history.distanceFromClinicKm,
                                notes: patient.history.notes,
                                isActive: true,
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                });

                createdPatients.push({
                    id: createdPatient.id,
                    history: patient.history,
                });
            }

            for (const appointmentDefinition of sampleAppointmentDefinitions) {
                const doctor = createdDoctors[appointmentDefinition.doctorIndex];
                const patient = createdPatients[appointmentDefinition.patientIndex];

                if (!doctor || !patient) {
                    throw new Error('Sample appointment definition references missing sample data');
                }

                const scheduledAt = getClinicDateTime(
                    addClinicDays(todayParts, appointmentDefinition.dateOffset),
                    appointmentDefinition.time,
                    clinic.timezone
                );

                const appointment = await tx.appointment.create({
                    data: {
                        clinicId: clinic.id,
                        doctorId: doctor.id,
                        patientId: patient.id,
                        createdByUserId: input.createdByUserId,
                        scheduledAt,
                        durationMinutes: clinic.slotDurationMinutes,
                        status: appointmentDefinition.status,
                        bookingSource: appointmentDefinition.bookingSource,
                        reason: appointmentDefinition.reason,
                        notes: `${SAMPLE_DATA_NOTE_MARKER} ${appointmentDefinition.notes}`,
                    },
                    select: {
                        id: true,
                        patientId: true,
                        scheduledAt: true,
                    },
                });

                const completedAppointmentCount = Math.max(
                    patient.history.totalAppointments - patient.history.totalNoShows,
                    0
                );
                const prediction = predictNoShowRisk({
                    scheduledAt,
                    bookedAt: addMinutes(scheduledAt, -appointmentDefinition.bookedMinutesBefore),
                    patientNoShowCount: patient.history.totalNoShows,
                    patientLateArrivalCount: patient.history.totalLateArrivals,
                    patientCompletedAppointmentCount: completedAppointmentCount,
                    distanceFromClinicKm:
                        patient.history.distanceFromClinicKm === ''
                            ? null
                            : Number(patient.history.distanceFromClinicKm),
                });

                await tx.noShowPrediction.create({
                    data: {
                        appointmentId: appointment.id,
                        clinicId: clinic.id,
                        patientId: appointment.patientId,
                        riskLevel: prediction.riskLevel,
                        score: prediction.score,
                        reasons: prediction.reasons,
                    },
                });

                if (
                    appointmentDefinition.queueStatus !== null &&
                    appointmentDefinition.queuePosition !== null
                ) {
                    await tx.queueEntry.create({
                        data: {
                            clinicId: clinic.id,
                            appointmentId: appointment.id,
                            doctorId: doctor.id,
                            patientId: patient.id,
                            position: appointmentDefinition.queuePosition,
                            status: appointmentDefinition.queueStatus,
                            queuedAt: addMinutes(scheduledAt, -15),
                            calledAt:
                                appointmentDefinition.queueStatus === QueueStatus.CALLED ||
                                appointmentDefinition.queueStatus === QueueStatus.COMPLETED
                                    ? addMinutes(scheduledAt, 5)
                                    : null,
                            completedAt:
                                appointmentDefinition.queueStatus === QueueStatus.COMPLETED
                                    ? addMinutes(scheduledAt, 20)
                                    : null,
                        },
                    });
                }
            }

            const summary = await countSampleRecords(tx, clinic.id, today, clinic.timezone);

            return {
                outcome: 'CREATED' as const,
                today,
                summary,
            };
        });
    },
};
