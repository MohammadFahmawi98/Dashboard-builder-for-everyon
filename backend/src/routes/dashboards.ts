import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /dashboards - List user's dashboards
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.description, d.created_at, d.updated_at
       FROM dashboards d
       JOIN workspaces w ON d.workspace_id = w.id
       WHERE w.owner_id = $1
       ORDER BY d.updated_at DESC`,
      [req.user!.userId]
    );
    res.json({ dashboards: result.rows });
  } catch (err) {
    console.error('[list-dashboards]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /dashboards/:id - Get dashboard details with widgets
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const dashboard = await pool.query(
      `SELECT id, name, description, created_at FROM dashboards WHERE id = $1`,
      [id]
    );

    if (dashboard.rows.length === 0) {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }

    const tiles = await pool.query(
      `SELECT id, query_id, viz_type, config, position_x, position_y, width, height, created_at FROM tiles WHERE dashboard_id = $1 ORDER BY position_y, position_x`,
      [id]
    );

    res.json({ dashboard: dashboard.rows[0], tiles: tiles.rows });
  } catch (err: any) {
    console.error('[get-dashboard] Error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Internal server error', details: String(err) });
  }
});

// POST /dashboards - Create dashboard
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    let workspace = await pool.query(
      'SELECT id FROM workspaces WHERE owner_id = $1 LIMIT 1',
      [req.user!.userId]
    );

    let workspaceId: string;
    if (workspace.rows[0]) {
      workspaceId = workspace.rows[0].id;
    } else {
      const newWorkspace = await pool.query(
        'INSERT INTO workspaces (owner_id, name) VALUES ($1, $2) RETURNING id',
        [req.user!.userId, 'Default Workspace']
      );
      workspaceId = newWorkspace.rows[0].id;
      await pool.query(
        `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')
         ON CONFLICT (workspace_id, user_id) DO NOTHING`,
        [workspaceId, req.user!.userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO dashboards (workspace_id, name, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, created_at`,
      [workspaceId, name.trim(), description?.trim() || null, req.user!.userId]
    );
    res.status(201).json({ dashboard: result.rows[0] });
  } catch (err) {
    console.error('[create-dashboard]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /dashboards/:id - Update dashboard
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE dashboards d
       SET name = COALESCE($1, d.name),
           description = COALESCE($2, d.description),
           updated_at = NOW()
       WHERE d.id = $3 AND d.workspace_id IN (
         SELECT id FROM workspaces WHERE owner_id = $4
       )
       RETURNING d.id, d.name, d.description, d.updated_at`,
      [name?.trim() || null, description?.trim() || null, id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }

    res.json({ dashboard: result.rows[0] });
  } catch (err) {
    console.error('[update-dashboard]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /dashboards/:id - Delete dashboard
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM tiles WHERE dashboard_id = $1', [id]);
    const result = await pool.query(
      `DELETE FROM dashboards d
       WHERE d.id = $1 AND d.workspace_id IN (
         SELECT id FROM workspaces WHERE owner_id = $2
       )
       RETURNING d.id`,
      [id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[delete-dashboard]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
