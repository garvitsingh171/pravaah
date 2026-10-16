import { app } from './app.js';
import { env } from './config/env.js';
import { startPredictionRefreshWorker } from './modules/predictions/prediction.recalculation.service.js';

app.listen(env.port, () => {
    startPredictionRefreshWorker();
    console.log(`Server is running on http://localhost:${env.port}`);
});
