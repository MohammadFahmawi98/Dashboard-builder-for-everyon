import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  body: Record<string, any>;
  params: Record<string, string>;
  headers: Record<string, any>;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return; 
  }

  try {
    const { exp, userId } = verifyToken(header.slice(7));
    if (Date.now() >= exp * 1000) throw new Error('Token expired');
    req.user = { userId }; // assuming userId is part of JwtPayload
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return; 
  }
}