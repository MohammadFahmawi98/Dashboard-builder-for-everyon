export interface RestApiConfig {
  baseUrl: string;
  apiKey?: string;
  authHeader?: string;
}

export interface RestQueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: string[];
  executionMs: number;
}

function flatten(obj: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj || {})) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function runRestQuery(
  config: RestApiConfig,
  queryText: string,
  timeoutMs = 15_000,
): Promise<RestQueryResult> {
  let spec: any;
  try {
    spec = JSON.parse(queryText);
  } catch {
    throw new Error('REST query must be valid JSON: { "method": "GET", "path": "/users", "rowsPath": "data" }');
  }
  const method = (spec.method || 'GET').toUpperCase();
  const path = spec.path || '/';
  const url = config.baseUrl.replace(/\/+$/, '') + (path.startsWith('/') ? path : '/' + path);

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(spec.headers || {}) };
  if (config.apiKey) {
    headers[config.authHeader || 'Authorization'] = config.authHeader ? config.apiKey : `Bearer ${config.apiKey}`;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(spec.body || {}),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`REST ${res.status}: ${text.slice(0, 300)}`);
    }
    const json: any = await res.json();
    let rows: any[];
    if (spec.rowsPath) {
      rows = spec.rowsPath.split('.').reduce((a: any, k: string) => a?.[k], json);
    } else if (Array.isArray(json)) {
      rows = json;
    } else if (Array.isArray(json.data)) {
      rows = json.data;
    } else {
      rows = [json];
    }
    if (!Array.isArray(rows)) throw new Error('rowsPath did not resolve to an array');
    const flat = rows.map(flatten);
    const columns = flat.length > 0 ? Object.keys(flat[0]) : [];
    return {
      rows: flat,
      rowCount: flat.length,
      columns,
      executionMs: Date.now() - started,
    };
  } finally {
    clearTimeout(t);
  }
}
