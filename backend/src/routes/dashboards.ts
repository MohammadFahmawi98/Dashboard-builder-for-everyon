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
       WHERE d.user_id = $1
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
      `SELECT id, name, description, layout, created_at FROM dashboards
       WHERE id = $1 AND user_id = $2`,
      [id, req.user!.userId]
    );
    if (!dashboard.rows[0]) {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }

    const widgets = await pool.query(
      `SELECT id, title, type, config, x, y, width, height FROM widgets
       WHERE dashboard_id = $1 ORDER BY y, x`,
      [id]
    );

    res.json({ dashboard: dashboard.rows[0], widgets: widgets.rows });
  } catch (err) {
    console.error('[get-dashboard]', err);
    res.status(500).json({ error: 'Internal server error' });
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
    const result = await pool.query(
      `INSERT INTO dashboards (user_id, name, description, layout)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, created_at`,
      [req.user!.userId, name.trim(), description?.trim() || null, 'grid']
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
      `UPDATE dashboards
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, description, updated_at`,
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
    await pool.query('DELETE FROM widgets WHERE dashboard_id = $1', [id]);
    const result = await pool.query(
      'DELETE FROM dashboards WHERE id = $1 AND user_id = $2 RETURNING id',
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
