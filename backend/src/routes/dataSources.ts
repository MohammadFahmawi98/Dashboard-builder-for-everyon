import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const VALID_TYPES = ['stripe', 'postgres', 'mysql', 'bigquery', 'mongodb', 'redshift', 'snowflake', 'csv', 'rest_api', 'other'];

async function getOrCreateWorkspace(userId: string): Promise<string> {
  const existing = await pool.query('SELECT id FROM workspaces WHERE owner_id = $1 LIMIT 1', [userId]);
  if (existing.rows[0]) return existing.rows[0].id;
  const created = await pool.query(
    'INSERT INTO workspaces (owner_id, name) VALUES ($1, $2) RETURNING id',
    [userId, 'Default Workspace']
  );
  return created.rows[0].id;
}

// GET /data-sources - List user's connectors
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.type, c.status, c.created_at
       FROM connectors c
       JOIN workspaces w ON c.workspace_id = w.id
       WHERE w.owner_id = $1
       ORDER BY c.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ dataSources: result.rows });
  } catch (err) {
    console.error('[list-data-sources]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /data-sources - Create connector
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, config } = req.body;
  if (!name?.trim() || !type) {
    res.status(400).json({ error: 'name and type are required' });
    return;
  }

  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    return;
  }

  try {
    const workspaceId = await getOrCreateWorkspace(req.user!.userId);
    const result = await pool.query(
      `INSERT INTO connectors (workspace_id, name, type, config)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, type, status, created_at`,
      [workspaceId, name.trim(), type, JSON.stringify(config || {})]
    );
    res.status(201).json({ dataSource: result.rows[0] });
  } catch (err) {
    console.error('[create-data-source]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /data-sources/:id - Update connector
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, config, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE connectors c
       SET name = COALESCE($1, c.name),
           config = COALESCE($2, c.config),
           status = COALESCE($3, c.status),
           updated_at = NOW()
       FROM workspaces w
       WHERE c.id = $4 AND c.workspace_id = w.id AND w.owner_id = $5
       RETURNING c.id, c.name, c.type, c.status, c.updated_at`,
      [name?.trim() || null, config ? JSON.stringify(config) : null, status || null, id, req.user!.userId]
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

// DELETE /data-sources/:id - Delete connector
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM connectors c
       USING workspaces w
       WHERE c.id = $1 AND c.workspace_id = w.id AND w.owner_id = $2
       RETURNING c.id`,
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
