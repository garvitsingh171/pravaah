import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { healthRouter } from './modules/health/health.routes.js';
import { clinicRouter } from './modules/clinics/clinic.routes.js';
import { doctorRouter } from './modules/doctors/doctor.routes.js';
import { patientRouter } from './modules/patients/patient.routes.js';
import { appointmentRouter } from './modules/appointments/appointment.routes.js';

export const app = express();

app.use(
    cors({
        origin: env.clientUrl,
    })
);

app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/clinics', clinicRouter);
app.use('/api/clinics', doctorRouter);
app.use('/api/clinics', patientRouter);
app.use('/api/clinics', appointmentRouter);

app.use(errorHandler);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the Pravaah API',
    });
});
