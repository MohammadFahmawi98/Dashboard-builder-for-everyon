import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || ''; 
if (!SECRET || SECRET.length < 32) throw new Error('JWT_SECRET is not defined or is too weak. It must be at least 32 characters long.'); 
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}