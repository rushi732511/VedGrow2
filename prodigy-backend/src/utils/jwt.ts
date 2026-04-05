import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AccessTokenPayload {
    sub: string;       // admin user id
    email: string;
    role: string;
}

export interface RefreshTokenPayload {
    sub: string;       // admin user id
}

// ─── Token Generation ─────────────────────────────────────────────────────────
export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
}

// ─── Token Verification ───────────────────────────────────────────────────────
export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}