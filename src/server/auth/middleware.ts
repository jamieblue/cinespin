import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void
{
    if (req.isAuthenticated())
    {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void
{
    // This middleware just passes through whether authenticated or not
    // Useful for endpoints that work differently for authenticated users
    next();
}