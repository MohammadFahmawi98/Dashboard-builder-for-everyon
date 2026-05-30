import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  body: Record<string, unknown>; // Changed from 'any' to 'unknown'
  params: Record<string, string>;
  headers: Record<string, string | undefined>; // Changed from 'any' to a more specific type
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}