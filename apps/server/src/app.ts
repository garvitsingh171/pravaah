import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { clinicRouter } from './modules/clinics/clinic.routes.js';
import { doctorRouter } from './modules/doctors/doctor.routes.js';
import { patientRouter } from './modules/patients/patient.routes.js';
import {
    appointmentRouter,
    clinicAppointmentRouter,
} from './modules/appointments/appointment.routes.js';
import { queueRouter } from './modules/queues/queue.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';

export const app = express();

app.use(clerkMiddleware());

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || env.allowedClientOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(null, false);
        },
    })
);

app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/clinics', clinicRouter);
app.use('/api/clinics', doctorRouter);
app.use('/api/clinics', patientRouter);
app.use('/api/clinics', clinicAppointmentRouter);
app.use('/api', appointmentRouter);
app.use('/api/clinics', queueRouter);
app.use('/api/clinics', dashboardRouter);

app.use(errorHandler);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the Pravaah API',
    });
});
