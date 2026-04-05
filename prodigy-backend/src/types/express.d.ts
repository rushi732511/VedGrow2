// This file extends Express's built-in types to add our custom
// properties to the Request object.

import { AdminRole } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            admin?: {
                id: string;
                email: string;
                role: AdminRole;
            };
        }
    }
}