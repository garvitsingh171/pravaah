// Fictional, deterministic clinic data for local UI review only.
export const clinicId = '11111111-1111-4111-8111-111111111111';
const stamp = '2026-11-01T03:30:00.000Z';
export const clinic = {
    id: clinicId,
    name: 'Pravaah Demo Clinic',
    slug: 'demo-clinic',
    timezone: 'Asia/Kolkata',
    isActive: true,
    phone: '+91 90000 00000',
    email: 'clinic@example.test',
    addressLine1: '12 Demo Road',
    addressLine2: null,
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    pincode: '411001',
    openingTime: '09:00',
    closingTime: '18:00',
    slotDurationMinutes: 15,
    bufferMinutes: 5,
    lateArrivalGraceMinutes: 15,
    geocodingStatus: 'NOT_GEOCODED',
    createdAt: stamp,
    updatedAt: stamp,
};
export const user = {
    id: 'demo-user',
    clerkUserId: 'demo-clerk',
    fullName: 'Asha Mehta',
    email: 'asha@example.test',
    role: 'ADMIN',
    status: 'ACTIVE',
    clinicId,
    clinic,
    phone: null,
    createdAt: stamp,
    updatedAt: stamp,
};
export const setup = {
    clinicSettingsComplete: true,
    hasDoctor: true,
    hasPatient: true,
    hasAppointment: true,
};
export const doctors = ['Dr. Mira Shah', 'Dr. Arjun Rao'].map((fullName, index) => ({
    id: `10000000-0000-4000-8000-00000000000${index + 1}`,
    fullName,
    specialization: index ? 'Paediatrics' : 'Family Medicine',
    qualification: 'MBBS, MD',
    registrationNumber: `DEMO-${index + 1}`,
    phone: '+91 90000 01001',
    email: `doctor${index}@example.test`,
    experienceYears: 12,
    isActive: true,
    createdAt: stamp,
    updatedAt: stamp,
}));
export const patients = [
    'Riya Sharma',
    'Kabir Sen',
    'Anaya Desai',
    'Dev Kapoor',
    'Tara Joshi',
    'Ishaan Roy',
].map((fullName, index) => ({
    id: `20000000-0000-4000-8000-00000000000${index + 1}`,
    fullName,
    phone: '+91 90000 02001',
    email: `patient${index}@example.test`,
    age: 32 + index,
    gender: 'OTHER',
    isActive: true,
    createdAt: stamp,
    updatedAt: stamp,
}));
const statuses = ['CALLED', 'IN_QUEUE', 'ARRIVED', 'CONFIRMED', 'SCHEDULED', 'COMPLETED'];
const queueStatuses = ['CALLED', 'WAITING', 'ARRIVED', 'WAITING', 'WAITING', 'COMPLETED'];
export function dataFor(url, state = 'populated', role = 'ADMIN') {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: clinic.timezone }).format(new Date());
    const appointments = patients.map((patient, index) => ({
        id: `30000000-0000-4000-8000-00000000000${index + 1}`,
        clinicId,
        patientId: patient.id,
        doctorId: doctors[index % 2].id,
        patient,
        doctor: doctors[index % 2],
        scheduledAt: `${date}T0${4 + index}:00:00.000Z`,
        durationMinutes: 15,
        status: statuses[index],
        bookingSource: 'RECEPTION',
        reason: 'Routine follow-up',
        notes: null,
        arrivedAt: index < 3 ? stamp : null,
        createdAt: stamp,
        updatedAt: stamp,
        noShowPrediction: {
            id: `prediction-${index}`,
            riskLevel: index === 3 ? 'HIGH' : 'LOW',
            score: index === 3 ? 70 : 10,
            reasons: [
                index === 3 ? 'Previous missed appointments' : 'Consistent attendance history',
            ],
            suggestedActions: ['Confirm the visit with the patient.'],
            ruleVersion: 'rules-v1',
            createdAt: stamp,
        },
        queueEntry: {
            id: `queue-${index}`,
            position: index + 1,
            status: queueStatuses[index],
            queuedAt: stamp,
        },
    }));
    const queueEntries = appointments.map((appointment, index) => ({
        ...appointment.queueEntry,
        clinicId,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointment,
        patient: appointment.patient,
        doctor: appointment.doctor,
        noShowPrediction: appointment.noShowPrediction,
        calledAt: index === 0 ? stamp : null,
        completedAt: index === 5 ? stamp : null,
        createdAt: stamp,
        updatedAt: stamp,
    }));
    const empty = state === 'empty';
    const path = url.pathname;
    if (path.endsWith('/auth/onboarding-status'))
        return {
            onboarding: { status: 'COMPLETED', nextStep: 'OPEN_APPLICATION', isComplete: true },
            user: { ...user, role },
            clinic,
            setup,
        };
    if (path.endsWith('/auth/me')) return { user: { ...user, role } };
    if (path.endsWith('/dashboard/summary'))
        return {
            dashboardSummary: {
                clinicId,
                date,
                appointmentSummary: Object.fromEntries(
                    Object.entries({
                        total: 6,
                        scheduled: 1,
                        confirmed: 1,
                        arrived: 1,
                        inQueue: 1,
                        called: 1,
                        completed: 1,
                        cancelled: 0,
                        noShow: 0,
                    }).map(([k, v]) => [k, empty ? 0 : v])
                ),
                queueSummary: {
                    total: empty ? 0 : 6,
                    waiting: empty ? 0 : 3,
                    arrived: empty ? 0 : 1,
                    called: empty ? 0 : 1,
                    completed: empty ? 0 : 1,
                    cancelled: 0,
                    noShow: 0,
                },
                noShowRiskSummary: { high: empty ? 0 : 1, medium: 0, low: empty ? 0 : 5 },
            },
        };
    if (path.endsWith('/dashboard/today-activity'))
        return {
            clinicId,
            date,
            activityItems: empty
                ? []
                : appointments.slice(0, 3).map((appointment, index) => ({
                      id: `activity-${index}`,
                      type: 'APPOINTMENT_BOOKED',
                      timestamp: stamp,
                      appointment,
                      doctor: appointment.doctor,
                      patient: appointment.patient,
                  })),
        };
    if (path.endsWith('/dashboard/no-show-intelligence'))
        return {
            noShowIntelligence: {
                clinicId,
                from: url.searchParams.get('from'),
                to: url.searchParams.get('to'),
                totalUpcoming: empty ? 0 : 3,
                riskCounts: { high: empty ? 0 : 1, medium: 0, low: empty ? 0 : 2, unavailable: 0 },
                contributingFactors: [],
                highRiskAppointments: empty
                    ? []
                    : [
                          {
                              appointment: appointments[3],
                              doctor: appointments[3].doctor,
                              patient: patients[3],
                              noShowPrediction: appointments[3].noShowPrediction,
                          },
                      ],
            },
        };
    if (path.endsWith('/appointments')) {
        const rows = empty
            ? []
            : appointments.filter(
                  (a) =>
                      (!url.searchParams.get('status') ||
                          a.status === url.searchParams.get('status')) &&
                      (!url.searchParams.get('search') ||
                          a.patient.fullName
                              .toLowerCase()
                              .includes(url.searchParams.get('search').toLowerCase()))
              );
        return {
            appointments: rows,
            pagination: {
                page: 1,
                limit: 15,
                total: rows.length,
                totalItems: rows.length,
                totalPages: 1,
                hasNextPage: false,
            },
        };
    }
    if (path.endsWith('/queue')) return { clinicId, date, queueEntries: empty ? [] : queueEntries };
    if (path.endsWith('/doctors'))
        return {
            doctors: empty
                ? []
                : doctors.map((doctor, index) => ({
                      ...doctor,
                      doctorClinicId: `link-${index}`,
                      clinicLinkIsActive: true,
                  })),
        };
    if (path.endsWith('/patients'))
        return {
            patients: empty
                ? []
                : patients
                      .filter(
                          (p) =>
                              !url.searchParams.get('search') ||
                              p.fullName
                                  .toLowerCase()
                                  .includes(url.searchParams.get('search').toLowerCase())
                      )
                      .map((patient, index) => ({
                          id: `link-${index}`,
                          clinicId,
                          patient,
                          patientId: patient.id,
                          totalAppointments: 4,
                          totalCompletedVisits: 3,
                          totalNoShows: 1,
                          totalLateArrivals: 0,
                          isActive: true,
                      })),
            pagination: { page: 1, limit: 20, hasNextPage: false },
        };
    if (path.endsWith('/staff/invitations')) return { invitations: [] };
    if (path.endsWith('/staff'))
        return {
            members: [
                user,
                {
                    ...user,
                    id: 'staff-demo',
                    fullName: 'Neel Patel',
                    email: 'neel@example.test',
                    role: 'STAFF',
                },
            ],
        };
    if (path.endsWith('/lifecycle-impact'))
        return { impact: { futureAppointments: 2, activeQueueEntries: 3, activeStaff: 1 } };
    if (path.endsWith(`/clinics/${clinicId}`)) return { clinic };
    return null;
}
