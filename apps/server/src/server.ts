import { app } from './app.js';
import { env } from './config/env.js';
import { startPredictionRefreshWorker } from './modules/predictions/prediction.recalculation.service.js';
import { deleteExpiredRateLimitCounters } from './middleware/rateLimit.js';

app.listen(env.port, () => {
    startPredictionRefreshWorker();
    console.log(`Server is running on http://localhost:${env.port}`);
});

const cleanupTimer = setInterval(
    () => {
        void deleteExpiredRateLimitCounters().catch(() => {
            console.error(JSON.stringify({ event: 'rate_limit.cleanup_error' }));
        });
    },
    60 * 60 * 1000
);
cleanupTimer.unref();
