import { Router, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runPostgresQuery, PostgresConfig } from '../connectors/postgres';
import { runRestQuery, RestApiConfig } from '../connectors/restApi';
import { runStripeQuery, StripeConfig } from '../connectors/stripe';
import * as cache from '../config/redis';

const router = Router();

async function getWorkspaceId(userId: string): Promise<string | null> {
  const r = await pool.query('SELECT id FROM workspaces WHERE owner_id = $1 LIMIT 1', [userId]);
  return r.rows[0]?.id || null;
}

// GET /queries - list queries in user's workspace
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.connector_id, q.query_text, q.type, q.cache_ttl, q.created_at
       FROM queries q
       JOIN workspaces w ON q.workspace_id = w.id
       WHERE w.owner_id = $1
       ORDER BY q.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ queries: result.rows });
  } catch (err) {
    console.error('[list-queries]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /queries - create query
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { connectorId, queryText, type, cacheTtl } = req.body;
  if (!queryText?.trim()) {
    res.status(400).json({ error: 'queryText is required' });
    return;
  }
  try {
    const workspaceId = await getWorkspaceId(req.user!.userId);
    if (!workspaceId) {
      res.status(400).json({ error: 'No workspace found for user' });
      return;
    }
    if (connectorId) {
      const conn = await pool.query(
        'SELECT id FROM connectors WHERE id = $1 AND workspace_id = $2',
        [connectorId, workspaceId]
      );
      if (!conn.rows[0]) {
        res.status(404).json({ error: 'Connector not found' });
        return;
      }
    }
    const result = await pool.query(
      `INSERT INTO queries (workspace_id, connector_id, query_text, type, cache_ttl)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, connector_id, query_text, type, cache_ttl, created_at`,
      [workspaceId, connectorId || null, queryText.trim(), type || 'sql', cacheTtl ?? 300]
    );
    res.status(201).json({ query: result.rows[0] });
  } catch (err) {
    console.error('[create-query]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /queries/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { queryText, type, cacheTtl, connectorId } = req.body;
  try {
    const result = await pool.query(
      `UPDATE queries q
       SET query_text = COALESCE($1, q.query_text),
           type = COALESCE($2, q.type),
           cache_ttl = COALESCE($3, q.cache_ttl),
           connector_id = COALESCE($4, q.connector_id),
           updated_at = NOW()
       FROM workspaces w
       WHERE q.id = $5 AND q.workspace_id = w.id AND w.owner_id = $6
       RETURNING q.id, q.connector_id, q.query_text, q.type, q.cache_ttl, q.updated_at`,
      [queryText?.trim() || null, type || null, cacheTtl ?? null, connectorId || null, id, req.user!.userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }
    // Invalidate any cached results for this query
    await cache.del(`query:${id}`);
    res.json({ query: result.rows[0] });
  } catch (err) {
    console.error('[update-query]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /queries/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM queries q
       USING workspaces w
       WHERE q.id = $1 AND q.workspace_id = w.id AND w.owner_id = $2
       RETURNING q.id`,
      [id, req.user!.userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }
    await cache.del(`query:${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[delete-query]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /queries/:id/run - execute query through its connector
router.post('/:id/run', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { skipCache } = req.body || {};
  try {
    const q = await pool.query(
      `SELECT q.id, q.query_text, q.cache_ttl, c.type AS connector_type, c.config AS connector_config
       FROM queries q
       JOIN workspaces w ON q.workspace_id = w.id
       LEFT JOIN connectors c ON q.connector_id = c.id
       WHERE q.id = $1 AND w.owner_id = $2`,
      [id, req.user!.userId]
    );
    if (!q.rows[0]) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }
    const { query_text, cache_ttl, connector_type, connector_config } = q.rows[0];
    if (!connector_type) {
      res.status(400).json({ error: 'Query has no connector attached' });
      return;
    }

    const cacheKey = `query:${id}:${crypto.createHash('sha1').update(query_text).digest('hex')}`;
    if (!skipCache) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.json({ ...JSON.parse(cached), cached: true });
        return;
      }
    }

    let result;
    if (connector_type === 'postgres') {
      result = await runPostgresQuery(connector_config as PostgresConfig, query_text);
    } else if (connector_type === 'rest_api') {
      result = await runRestQuery(connector_config as RestApiConfig, query_text);
    } else if (connector_type === 'stripe') {
      result = await runStripeQuery(connector_config as StripeConfig, query_text);
    } else {
      res.status(501).json({ error: `Connector type '${connector_type}' not yet implemented` });
      return;
    }

    const payload = { ...result, cached: false };
    await cache.set(cacheKey, JSON.stringify(result), cache_ttl);
    res.json(payload);
  } catch (err: any) {
    console.error('[run-query]', err?.message || err);
    res.status(500).json({ error: err?.message || 'Query execution failed' });
  }
});

export default router;
