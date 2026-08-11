import { Request, Response, NextFunction } from 'express';

// Centralized error handler — formats all errors consistently
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Prisma unique constraint violation
  if (err.message.includes('Unique constraint') || err.message.includes('unique constraint')) {
    res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      error: 'DUPLICATE_ENTRY',
    });
    return;
  }

  // Prisma record not found
  if (err.message.includes('Record to update not found') || err.message.includes('No record was found')) {
    res.status(404).json({
      success: false,
      message: 'Record not found',
      error: 'NOT_FOUND',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: 'SERVER_ERROR',
  });
}
