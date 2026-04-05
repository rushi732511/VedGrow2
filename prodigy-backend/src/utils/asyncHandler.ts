import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;

/**
 * Wraps an async route handler so that any thrown error or rejected
 * Promise is automatically passed to Express's error handler via next().
 *
 * Without this, you'd need try/catch in every single route:
 *   router.get('/', async (req, res, next) => {
 *     try { ... } catch (err) { next(err); }  // tedious
 *   });
 *
 * With this wrapper:
 *   router.get('/', asyncHandler(async (req, res) => {
 *     ...  // errors automatically forwarded to errorHandler middleware
 *   }));
 */
export const asyncHandler = (fn: AsyncRouteHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
};