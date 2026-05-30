import jwt from 'jsonwebtoken';
import config from '../config';  // Importing the configuration file

const SECRET = process.env.JWT_SECRET; 
if (!SECRET) throw new Error('JWT_SECRET must be provided and cannot be an empty string'); 
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || config.jwt.expiresIn;  // Using config for expiration time

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}