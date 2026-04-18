import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /workspaces — list workspaces the user belongs to
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.name, w.plan, w.created_at, wm.role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ workspaces: result.rows });
  } catch (err) {
    console.error('[workspaces:list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /workspaces — create workspace
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ws = await client.query(
      `INSERT INTO workspaces (owner_id, name) VALUES ($1, $2)
       RETURNING id, name, plan, created_at`,
      [req.user!.userId, name.trim()]
    );

    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [ws.rows[0].id, req.user!.userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ workspace: ws.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[workspaces:create]', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /workspaces/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.name, w.plan, w.owner_id, w.created_at, wm.role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE w.id = $1 AND wm.user_id = $2`,
      [req.params.id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json({ workspace: result.rows[0] });
  } catch (err) {
    console.error('[workspaces:get]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /workspaces/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    const access = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [req.params.id, req.user!.userId]
    );
    if (!access.rows[0] || access.rows[0].role !== 'owner') {
      res.status(403).json({ error: 'Only owners can update the workspace' });
      return;
    }

    const result = await pool.query(
      `UPDATE workspaces SET name = $1 WHERE id = $2 RETURNING id, name, plan, created_at`,
      [name.trim(), req.params.id]
    );
    res.json({ workspace: result.rows[0] });
  } catch (err) {
    console.error('[workspaces:update]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /workspaces/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const access = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [req.params.id, req.user!.userId]
    );
    if (!access.rows[0] || access.rows[0].role !== 'owner') {
      res.status(403).json({ error: 'Only owners can delete the workspace' });
      return;
    }

    await pool.query('DELETE FROM workspaces WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('[workspaces:delete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /workspaces/:id/members
router.get('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const access = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [req.params.id, req.user!.userId]
    );
    if (!access.rows[0]) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, wm.role, wm.created_at
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.created_at ASC`,
      [req.params.id]
    );
    res.json({ members: result.rows });
  } catch (err) {
    console.error('[workspaces:members]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /workspaces/:id/members — invite by email
router.post('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, role = 'viewer' } = req.body;
  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }
  if (!['editor', 'viewer'].includes(role)) {
    res.status(400).json({ error: 'role must be editor or viewer' });
    return;
  }

  try {
    const access = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [req.params.id, req.user!.userId]
    );
    if (!access.rows[0] || access.rows[0].role === 'viewer') {
      res.status(403).json({ error: 'Only owners and editors can invite members' });
      return;
    }

    const invitee = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!invitee.rows[0]) {
      res.status(404).json({ error: 'No user found with that email' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [req.params.id, invitee.rows[0].id, role]
    );
    res.status(201).json({ member: result.rows[0] });
  } catch (err) {
    console.error('[workspaces:invite]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
