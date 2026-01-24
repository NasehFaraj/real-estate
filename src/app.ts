import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';

const app = express();

app.use(requestIdMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

app.use(errorMiddleware);

export default app;
