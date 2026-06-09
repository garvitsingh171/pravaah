import { Router } from 'express';
import { createClinicController } from './clinic.controller.js';
import { validateRequest } from '../../utils/validateRequest.js';
import { createClinicSchema } from './clinic.validation.js';

const clinicRouter = Router();

clinicRouter.post('/', validateRequest({ body: createClinicSchema }), createClinicController);

export { clinicRouter };
