import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message, error: 'VALIDATION_ERROR' });
      return;
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    res.json({ success: true, message: 'Login successful', data: result });
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ success: false, message: 'Invalid email or password', error: 'INVALID_CREDENTIALS' });
      return;
    }
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getUserById(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
