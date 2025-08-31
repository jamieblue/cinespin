import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void
{
    if (req.isAuthenticated() && req.user)
    {
        return next();
    }

    res.status(401).json({ success: false, error: 'Authentication required' });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void
{
    next();
}