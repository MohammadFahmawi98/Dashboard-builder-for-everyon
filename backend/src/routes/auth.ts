import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import { signToken } from '../auth/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'email, password, and name are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, plan, created_at`,
      [email.toLowerCase().trim(), password_hash, name.trim()]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[signup]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, plan, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    const token = signToken({ userId: user.id, email: user.email });

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, plan, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /auth/profile
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email } = req.body;
  if (!name?.trim() && !email?.trim()) {
    res.status(400).json({ error: 'name or email is required' });
    return;
  }

  try {
    if (email) {
      const conflict = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase().trim(), req.user!.userId]
      );
      if (conflict.rows.length > 0) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE users
       SET name  = COALESCE($1, name),
           email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, email, name, plan, created_at`,
      [name?.trim() || null, email?.toLowerCase().trim() || null, req.user!.userId]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[profile]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/change-password
router.post('/change-password', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: 'oldPassword and newPassword are required' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'newPassword must be at least 8 characters' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (!(await bcrypt.compare(oldPassword, result.rows[0].password_hash))) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user!.userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('[change-password]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'email is required' }); return; }

  try {
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    // Always return success to avoid email enumeration
    if (!user.rows[0]) { res.json({ success: true }); return; }

    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1', [user.rows[0].id]);
    const token = await pool.query(
      `INSERT INTO password_reset_tokens (user_id) VALUES ($1) RETURNING token`,
      [user.rows[0].id]
    );

    // In production: send email. For now, return token directly (dev only)
    console.log(`[reset-token] ${email} → ${token.rows[0].token}`);
    res.json({ success: true, dev_token: token.rows[0].token });
  } catch (err) {
    console.error('[forgot-password]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) { res.status(400).json({ error: 'token and newPassword are required' }); return; }
  if (newPassword.length < 8) { res.status(400).json({ error: 'newPassword must be at least 8 characters' }); return; }

  try {
    const row = await pool.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    if (!row.rows[0]) { res.status(400).json({ error: 'Invalid or expired reset token' }); return; }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, row.rows[0].user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    res.json({ success: true });
  } catch (err) {
    console.error('[reset-password]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/refresh
router.post('/refresh', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, plan FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user });
  } catch (err) {
    console.error('[refresh]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
