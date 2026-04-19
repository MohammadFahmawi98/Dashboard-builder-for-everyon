// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../api/client';

interface Query {
  id: string;
  connector_id: string | null;
  query_text: string;
  type: string;
  cache_ttl: number;
  created_at: string;
}

interface Connector {
  id: string;
  name: string;
  type: string;
}

interface RunResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  executionMs: number;
  cached: boolean;
}

export default function QueryBuilder() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selected, setSelected] = useState<Query | null>(null);
  const [connectorId, setConnectorId] = useState('');
  const [sql, setSql] = useState('SELECT 1 AS hello;');
  const [cacheTtl, setCacheTtl] = useState(300);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);

  async function load() {
    try {
      const [qr, cr] = await Promise.all([api.get('/queries'), api.get('/data-sources')]);
      setQueries(qr.data.queries || []);
      setConnectors(cr.data.dataSources || cr.data.connectors || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load');
    }
  }

  function openQuery(q: Query) {
    setSelected(q);
    setConnectorId(q.connector_id || '');
    setSql(q.query_text);
    setCacheTtl(q.cache_ttl);
    setResult(null);
    setError('');
  }

  function newQuery() {
    setSelected(null);
    setConnectorId('');
    setSql('SELECT 1 AS hello;');
    setCacheTtl(300);
    setResult(null);
    setError('');
  }

  async function save() {
    if (!sql.trim()) { setError('Query text required'); return; }
    setSaving(true);
    setError('');
    try {
      if (selected) {
        const { data } = await api.put(`/queries/${selected.id}`, {
          queryText: sql, connectorId: connectorId || null, cacheTtl: Number(cacheTtl)
        });
        setQueries(queries.map(q => q.id === data.query.id ? data.query : q));
        setSelected(data.query);
        setSuccess('Saved');
      } else {
        const { data } = await api.post('/queries', {
          queryText: sql, connectorId: connectorId || null, type: 'sql', cacheTtl: Number(cacheTtl)
        });
        setQueries([data.query, ...queries]);
        setSelected(data.query);
        setSuccess('Query created');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function run(skipCache = false) {
    if (!selected) { setError('Save query first before running'); return; }
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post(`/queries/${selected.id}/run`, { skipCache });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Query failed');
    } finally {
      setRunning(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this query?')) return;
    try {
      await api.delete(`/queries/${id}`);
      setQueries(queries.filter(q => q.id !== id));
      if (selected?.id === id) newQuery();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar: query list */}
      <aside className="w-64 flex-shrink-0 border-r border-[#2a2a3a] bg-[#13131c] overflow-y-auto">
        <div className="p-4 border-b border-[#2a2a3a]">
          <button onClick={newQuery}
            className="w-full px-3 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white text-sm font-semibold">
            + New Query
          </button>
        </div>
        <div className="p-2 space-y-1">
          {queries.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-2">No queries yet</p>
          ) : queries.map(q => (
            <button key={q.id} onClick={() => openQuery(q)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selected?.id === q.id ? 'bg-[#7c6af7]/20 text-[#7c6af7]' : 'text-gray-400 hover:bg-[#2a2a3a] hover:text-white'
              }`}>
              <div className="truncate font-medium">{q.query_text.slice(0, 40)}</div>
              <div className="text-xs text-gray-500">TTL {q.cache_ttl}s</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Query Builder</h1>
              <p className="text-gray-400 text-sm mt-1">{selected ? `Editing query ${selected.id.slice(0, 8)}…` : 'New query'}</p>
            </div>
            {selected && (
              <button onClick={() => remove(selected.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
            )}
          </div>

          {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}
          {success && <div className="mb-4 px-4 py-2 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">{success}</div>}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Connector</label>
              <select value={connectorId} onChange={e => setConnectorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] text-white text-sm">
                <option value="">— None —</option>
                {connectors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cache TTL (seconds)</label>
              <input type="number" value={cacheTtl} onChange={e => setCacheTtl(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] text-white text-sm" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">SQL</label>
            <textarea value={sql} onChange={e => setSql(e.target.value)}
              rows={10} spellCheck={false}
              className="w-full px-4 py-3 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm font-mono focus:outline-none focus:border-[#7c6af7]" />
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={save} disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#2a2a3a] hover:bg-[#3a3a4a] disabled:opacity-60 text-white font-semibold text-sm">
              {saving ? 'Saving…' : selected ? 'Save' : 'Create'}
            </button>
            <button onClick={() => run(false)} disabled={!selected || running}
              className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm">
              {running ? 'Running…' : '▶ Run'}
            </button>
            <button onClick={() => run(true)} disabled={!selected || running}
              className="px-5 py-2 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] hover:bg-[#2a2a3a] text-gray-300 text-sm">
              Run (skip cache)
            </button>
          </div>

          {result && (
            <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a3a] flex items-center justify-between text-sm">
                <div className="text-gray-300">
                  <span className="font-semibold">{result.rowCount}</span> rows
                  {result.executionMs != null && <span className="text-gray-500"> · {result.executionMs}ms</span>}
                  {result.cached && <span className="ml-2 px-2 py-0.5 rounded bg-[#7c6af7]/20 text-[#7c6af7] text-xs">cached</span>}
                </div>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-[#0f0f18] sticky top-0">
                    <tr>
                      {result.columns.map(c => <th key={c} className="px-4 py-2 text-left text-gray-400 font-medium">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 200).map((r, i) => (
                      <tr key={i} className="border-t border-[#2a2a3a]">
                        {result.columns.map(c => (
                          <td key={c} className="px-4 py-2 text-gray-300 whitespace-nowrap">
                            {r[c] == null ? <span className="text-gray-600">null</span> : String(r[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length > 200 && (
                  <p className="px-4 py-2 text-xs text-gray-500">Showing first 200 of {result.rowCount} rows</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
