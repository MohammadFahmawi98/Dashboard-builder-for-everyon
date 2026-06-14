import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  body: Record<string, any>;
  params: Record<string, string>;
  headers: Record<string, any>;
}

const validTokens: Set<string> = new Set(['your_valid_token_1', 'your_valid_token_2']); // replace with your actual valid tokens

export function isValidToken(token: string): boolean {
  return validTokens.has(token);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return; 
  }

  const token = header.slice(7);
  if (!isValidToken(token)) {
    res.status(401).json({ error: 'Invalid token' });
    return; 
  }

  try {
    const { exp, userId } = verifyToken(token);
    if (Date.now() >= exp * 1000) throw new Error('Token expired');
    req.user = { userId }; // assuming userId is part of JwtPayload

    // Fix the SQL injection vulnerability
    const email = req.body.email; // assuming email comes from the request body
    await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase().trim(), req.user!.userId]);

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return; 
  }
}