import { Router } from 'express';
import { createClinicController } from './clinic.controller.js';

const clinicRouter = Router();

clinicRouter.post('/', createClinicController);

export { clinicRouter };
