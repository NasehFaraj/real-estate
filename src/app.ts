import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import usersRoutes from './routes/users.routes.js';
import offersRoutes from './routes/offers.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import matchesRoutes from './routes/matches.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { swaggerSpec, swaggerUiHandler, swaggerUiMiddleware } from './config/swagger.js';
import { env } from './config/env.js';

const app = express();

if (env.trustProxy) {
    app.set('trust proxy', 1);
}

app.use(requestIdMiddleware);
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            if (env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUiMiddleware, swaggerUiHandler);
app.use('/api/users', usersRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/stats', statsRoutes);

app.use(errorMiddleware);

export default app;
