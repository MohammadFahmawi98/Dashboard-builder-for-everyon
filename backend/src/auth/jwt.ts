import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET; 
if (!SECRET) throw new Error('JWT_SECRET must be provided and cannot be an empty string'); 
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
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}