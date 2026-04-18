import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const VALID_VIZ_TYPES = ['bar', 'line', 'pie', 'table', 'number', 'area', 'scatter', 'heatmap', 'funnel', 'gauge', 'text', 'other'];

// POST /widgets - Create tile (widget) in dashboard
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { dashboardId, vizType, type, config, positionX, positionY, x, y, width, height, queryId } = req.body;
  const viz = vizType || type;

  if (!dashboardId || !viz) {
    res.status(400).json({ error: 'dashboardId and vizType are required' });
    return;
  }

  if (!VALID_VIZ_TYPES.includes(viz)) {
    res.status(400).json({ error: `vizType must be one of: ${VALID_VIZ_TYPES.join(', ')}` });
    return;
  }

  try {
    const dashboard = await pool.query(
      `SELECT d.id FROM dashboards d
       JOIN workspaces w ON d.workspace_id = w.id
       WHERE d.id = $1 AND w.owner_id = $2`,
      [dashboardId, req.user!.userId]
    );
    if (!dashboard.rows[0]) {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO tiles (dashboard_id, query_id, viz_type, config, position_x, position_y, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, dashboard_id, query_id, viz_type, config, position_x, position_y, width, height, created_at`,
      [dashboardId, queryId || null, viz, JSON.stringify(config || {}), positionX ?? x ?? 0, positionY ?? y ?? 0, width || 4, height || 4]
    );

    res.status(201).json({ widget: result.rows[0] });
  } catch (err) {
    console.error('[create-widget]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /widgets/:id - Update tile
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { config, positionX, positionY, x, y, width, height, vizType, queryId } = req.body;

  try {
    const tile = await pool.query(
      `SELECT t.id FROM tiles t
       JOIN dashboards d ON t.dashboard_id = d.id
       JOIN workspaces w ON d.workspace_id = w.id
       WHERE t.id = $1 AND w.owner_id = $2`,
      [id, req.user!.userId]
    );
    if (!tile.rows[0]) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    if (vizType && !VALID_VIZ_TYPES.includes(vizType)) {
      res.status(400).json({ error: `vizType must be one of: ${VALID_VIZ_TYPES.join(', ')}` });
      return;
    }

    const result = await pool.query(
      `UPDATE tiles
       SET viz_type = COALESCE($1, viz_type),
           config = COALESCE($2, config),
           position_x = COALESCE($3, position_x),
           position_y = COALESCE($4, position_y),
           width = COALESCE($5, width),
           height = COALESCE($6, height),
           query_id = COALESCE($7, query_id),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, dashboard_id, query_id, viz_type, config, position_x, position_y, width, height, updated_at`,
      [vizType || null, config ? JSON.stringify(config) : null, positionX ?? x ?? null, positionY ?? y ?? null, width || null, height || null, queryId || null, id]
    );

    res.json({ widget: result.rows[0] });
  } catch (err) {
    console.error('[update-widget]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /widgets/:id - Delete tile
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM tiles t
       USING dashboards d, workspaces w
       WHERE t.id = $1
         AND t.dashboard_id = d.id
         AND d.workspace_id = w.id
         AND w.owner_id = $2
       RETURNING t.id`,
      [id, req.user!.userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Widget not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[delete-widget]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
