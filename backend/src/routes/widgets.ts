import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /widgets - Create widget in dashboard
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { dashboardId, title, type, config, x, y, width, height } = req.body;

  if (!dashboardId || !title?.trim() || !type) {
    res.status(400).json({ error: 'dashboardId, title, and type are required' });
    return;
  }

  const validTypes = ['chart', 'table', 'stat', 'gauge', 'text'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    return;
  }

  try {
    // Verify dashboard ownership
    const dashboard = await pool.query(
      'SELECT id FROM dashboards WHERE id = $1 AND user_id = $2',
      [dashboardId, req.user!.userId]
    );
    if (!dashboard.rows[0]) {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO widgets (dashboard_id, title, type, config, x, y, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, type, config, x, y, width, height`,
      [dashboardId, title.trim(), type, JSON.stringify(config || {}), x || 0, y || 0, width || 4, height || 3]
    );

    res.status(201).json({ widget: result.rows[0] });
  } catch (err) {
    console.error('[create-widget]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /widgets/:id - Update widget
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, config, x, y, width, height } = req.body;

  try {
    // Verify widget belongs to user's dashboard
    const widget = await pool.query(
      `SELECT w.id FROM widgets w
       JOIN dashboards d ON w.dashboard_id = d.id
       WHERE w.id = $1 AND d.user_id = $2`,
      [id, req.user!.userId]
    );
    if (!widget.rows[0]) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE widgets
       SET title = COALESCE($1, title),
           config = COALESCE($2, config),
           x = COALESCE($3, x),
           y = COALESCE($4, y),
           width = COALESCE($5, width),
           height = COALESCE($6, height)
       WHERE id = $7
       RETURNING id, title, type, config, x, y, width, height`,
      [title?.trim() || null, config ? JSON.stringify(config) : null, x, y, width, height, id]
    );

    res.json({ widget: result.rows[0] });
  } catch (err) {
    console.error('[update-widget]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /widgets/:id - Delete widget
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Verify widget belongs to user's dashboard
    const widget = await pool.query(
      `SELECT w.id FROM widgets w
       JOIN dashboards d ON w.dashboard_id = d.id
       WHERE w.id = $1 AND d.user_id = $2`,
      [id, req.user!.userId]
    );
    if (!widget.rows[0]) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    await pool.query('DELETE FROM widgets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[delete-widget]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
