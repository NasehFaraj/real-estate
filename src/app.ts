import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import usersRoutes from './routes/users.routes.js';
import offersRoutes from './routes/offers.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import matchesRoutes from './routes/matches.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';

const app = express();

app.use(requestIdMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/stats', statsRoutes);

app.use(errorMiddleware);

export default app;
