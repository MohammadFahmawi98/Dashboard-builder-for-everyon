import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /data-sources - List user's data sources
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, type, created_at FROM data_sources
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.userId]
    );
    res.json({ dataSources: result.rows });
  } catch (err) {
    console.error('[list-data-sources]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /data-sources - Create data source
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, config } = req.body;
  if (!name?.trim() || !type) {
    res.status(400).json({ error: 'name and type are required' });
    return;
  }

  const validTypes = ['api', 'database', 'graphql'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO data_sources (user_id, name, type, config)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, type, created_at`,
      [req.user!.userId, name.trim(), type, JSON.stringify(config || {})]
    );
    res.status(201).json({ dataSource: result.rows[0] });
  } catch (err) {
    console.error('[create-data-source]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /data-sources/:id - Update data source
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, config } = req.body;

  try {
    const result = await pool.query(
      `UPDATE data_sources
       SET name = COALESCE($1, name),
           config = COALESCE($2, config)
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, type, created_at`,
      [name?.trim() || null, config ? JSON.stringify(config) : null, id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Data source not found' });
      return;
    }

    res.json({ dataSource: result.rows[0] });
  } catch (err) {
    console.error('[update-data-source]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /data-sources/:id - Delete data source
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM data_sources WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Data source not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[delete-data-source]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
