import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env, isDev } from './config/env';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import adminAuthRouter from './routes/admin/auth';
import adminBatchesRouter from './routes/admin/batches';
import adminApplicationsRouter from './routes/admin/applications';
import adminAnalyticsRouter from './routes/admin/analytics';
import adminEmailsRouter from './routes/admin/emails';
import adminLorRouter from './routes/admin/lor';
import certificatesRouter from './routes/certificates';
import contactRouter from './routes/contact';
import tracksRouter from './routes/tracks';
import applicationsRouter from './routes/applications';
import paymentsRouter from './routes/payments';
import taskSubmissionRouter from './routes/taskSubmission';
// ─── Create Express App ───────────────────────────────────────────────────────
const app: Application = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet sets security-focused HTTP headers automatically
// e.g., X-Content-Type-Options, X-Frame-Options, etc.
app.use(helmet());

// CORS — controls which domains can call our API
app.use(
    cors({
        origin: [env.FRONTEND_URL, env.ADMIN_URL],
        credentials: true,         // Allow cookies (needed for refresh token)
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── General Middleware ───────────────────────────────────────────────────────

// Parse incoming JSON request bodies → available as req.body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (HTML form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies (needed for refresh token)
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        req.cookies = Object.fromEntries(
            cookieHeader.split(';').map((c) => {
                const [key, ...v] = c.trim().split('=');
                return [key.trim(), decodeURIComponent(v.join('='))];
            })
        );
    }
    next();
});

// Compress responses with gzip — reduces bandwidth
app.use(compression());

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// General limiter for all public routes
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,    // 1 minute window
    max: 100,               // Max 100 requests per IP per window
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again in a minute.',
        },
    },
});

// Stricter limiter for certificate verification (prevent CIN brute-force)
const verifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many verification attempts. Please try again in a minute.',
        },
    },
});

app.use('/v1/certificates/verify', verifyLimiter);
app.use('/v1', generalLimiter);

// ─── Request Logger ───────────────────────────────────────────────────────────
// Log every incoming request in development
if (isDev) {
    app.use((req: Request, _res: Response, next) => {
        logger.debug(`${req.method} ${req.path}`, {
            query: req.query,
            ip: req.ip,
        });
        next(); // IMPORTANT: always call next() in middleware or the request hangs
    });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
// Simple endpoint for load balancers and uptime monitors
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Cookie parser needed for reading refresh token cookie
import cookieParser from 'express';
app.use(express.text()); // reuse express import — no new package needed

// Admin auth (public — no JWT required)
// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/v1/admin/auth', adminAuthRouter);
app.use('/v1/admin/batches', adminBatchesRouter);
app.use('/v1/admin/applications', adminApplicationsRouter);
app.use('/v1/admin/analytics', adminAnalyticsRouter);
app.use('/v1/admin/emails', adminEmailsRouter);
app.use('/v1/admin/lor', adminLorRouter);
app.use('/v1/certificates', certificatesRouter);
app.use('/v1/contact', contactRouter);
app.use('/v1/tracks', tracksRouter);
app.use('/v1/applications', applicationsRouter);
app.use('/v1', paymentsRouter);
app.use('/v1/task-submission', taskSubmissionRouter);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource does not exist.',
        },
    });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes and the 404 handler
app.use(errorHandler);
// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
    try {
        const port = parseInt(env.PORT, 10);

        app.listen(port, () => {
            logger.info(`🚀 Server running on port ${port}`, {
                environment: env.NODE_ENV,
                url: `http://localhost:${port}`,
            });
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}

startServer();

export default app;