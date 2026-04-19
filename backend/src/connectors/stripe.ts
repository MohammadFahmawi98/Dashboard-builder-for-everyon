export interface StripeConfig {
  apiKey: string;
}

export interface StripeQueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: string[];
  executionMs: number;
}

const ALLOWED_RESOURCES = new Set([
  'customers', 'charges', 'payment_intents', 'invoices', 'subscriptions',
  'products', 'prices', 'refunds', 'disputes', 'payouts', 'balance_transactions',
]);

export async function runStripeQuery(
  config: StripeConfig,
  queryText: string,
  timeoutMs = 15_000,
): Promise<StripeQueryResult> {
  let spec: any;
  try {
    spec = JSON.parse(queryText);
  } catch {
    throw new Error('Stripe query must be valid JSON: { "resource": "charges", "limit": 100, "params": {} }');
  }
  const resource = String(spec.resource || '').replace(/^\/+/, '');
  if (!ALLOWED_RESOURCES.has(resource)) {
    throw new Error(`Unsupported Stripe resource. Allowed: ${[...ALLOWED_RESOURCES].join(', ')}`);
  }
  const limit = Math.min(Number(spec.limit) || 100, 100);
  const params = new URLSearchParams({ limit: String(limit) });
  for (const [k, v] of Object.entries(spec.params || {})) {
    if (v != null) params.set(k, String(v));
  }
  const url = `https://api.stripe.com/v1/${resource}?${params.toString()}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Stripe ${res.status}: ${text.slice(0, 300)}`);
    }
    const json: any = await res.json();
    const rows: any[] = Array.isArray(json.data) ? json.data : [json];
    const flat = rows.map((r: any) => {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(r)) {
        const v = r[k];
        out[k] = v && typeof v === 'object' ? JSON.stringify(v) : v;
      }
      return out;
    });
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
