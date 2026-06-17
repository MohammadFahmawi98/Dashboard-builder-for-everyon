import jwt from 'jsonwebtoken';
import { config } from 'dotenv-safe';

config(); // Load environment variables with validation

const SECRET = process.env.JWT_SECRET || 'fallback_secret'; 
if (!SECRET) throw new Error('JWT_SECRET must be securely stored and managed, and cannot be an empty string.'); 
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
}

/** Signs a JWT token with the provided payload. 
 * @param {JwtPayload} payload - User data for the token. 
 * @returns {string} - The signed JWT token. 
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (!decoded || typeof decoded !== 'object') throw new Error('Invalid token');
    return decoded as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token: ' + error.message);
  }
}