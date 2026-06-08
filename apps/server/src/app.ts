import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { healthRouter } from './modules/health/health.routes.js';

export const app = express();

app.use(
    cors({
        origin: env.clientUrl,
    })
);

app.use(express.json());

app.use('/api/health', healthRouter);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the Pravaah API',
    });
});
