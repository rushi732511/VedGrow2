import winston from 'winston';
import { isDev } from '../config/env';

// ─── Log Formats ──────────────────────────────────────────────────────────────

// Development format: colorized, human-readable
const devFormat = winston.format.combine(
    winston.format.colorize(),           // Add colors to log levels
    winston.format.timestamp({           // Add timestamp to every log
        format: 'HH:mm:ss',               // Short time format for dev
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // If there's extra data attached to the log, print it as JSON
        const metaStr = Object.keys(meta).length
            ? '\n' + JSON.stringify(meta, null, 2)
            : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Production format: structured JSON (one object per line)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Include stack traces for errors
    winston.format.json()
);

// ─── Logger Instance ──────────────────────────────────────────────────────────
const logger = winston.createLogger({
    // Minimum level to log: debug < info < warn < error
    level: isDev ? 'debug' : 'info',

    format: isDev ? devFormat : prodFormat,

    transports: [
        // Always log to console
        new winston.transports.Console(),

        // In production, also write errors to a file
        ...(!isDev
            ? [
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                }),
            ]
            : []),
    ],
});

export default logger;