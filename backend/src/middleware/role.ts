import { Request, Response, NextFunction } from 'express';

// Factory that returns middleware allowing only specified roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required', error: 'NO_TOKEN' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        error: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
