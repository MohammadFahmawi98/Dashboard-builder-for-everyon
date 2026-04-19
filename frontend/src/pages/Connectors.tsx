// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../api/client';

interface Connector {
  id: string;
  name: string;
  type: string;
  config: any;
  created_at: string;
}

const TYPES = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'stripe', label: 'Stripe' },
];

export default function Connectors() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'postgres',
    host: '',
    port: '5432',
    database: '',
    user: '',
    password: '',
    ssl: true,
    baseUrl: '',
    apiKey: '',
  });

  useEffect(() => { fetchConnectors(); }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);

  async function fetchConnectors() {
    try {
      const { data } = await api.get('/data-sources');
      setConnectors(data.dataSources || data.connectors || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let config: any = {};
      if (form.type === 'postgres') {
        config = {
          host: form.host,
          port: Number(form.port) || 5432,
          database: form.database,
          user: form.user,
          password: form.password,
          ssl: form.ssl,
        };
      } else if (form.type === 'rest_api') {
        config = { baseUrl: form.baseUrl, apiKey: form.apiKey };
      } else if (form.type === 'stripe') {
        config = { apiKey: form.apiKey };
      }
      await api.post('/data-sources', { name: form.name, type: form.type, config });
      setShowModal(false);
      setForm({ name: '', type: 'postgres', host: '', port: '5432', database: '', user: '', password: '', ssl: true, baseUrl: '', apiKey: '' });
      setSuccess('Connector created');
      fetchConnectors();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create connector');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this connector?')) return;
    try {
      await api.delete(`/data-sources/${id}`);
      setConnectors(connectors.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Connectors</h1>
          <p className="text-gray-400 mt-1 text-sm">Data sources for your queries and dashboards</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white font-semibold text-sm transition-colors">
          + New Connector
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 px-4 py-2 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">{success}</div>}

      {loading ? (
        <div className="text-gray-400">Loading…</div>
      ) : connectors.length === 0 ? (
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-12 text-center">
          <p className="text-gray-400 mb-4">No connectors yet</p>
          <button onClick={() => setShowModal(true)}
            className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white font-semibold text-sm">
            Create your first connector
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map(c => (
            <div key={c.id} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{c.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-[#7c6af7]/20 text-[#7c6af7]">{c.type}</span>
                </div>
                <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Created {new Date(c.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">New Connector</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {form.type === 'postgres' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Host</label>
                      <input required value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
                        placeholder="db.example.com"
                        className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Port</label>
                      <input value={form.port} onChange={e => setForm({ ...form, port: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Database</label>
                    <input required value={form.database} onChange={e => setForm({ ...form, database: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">User</label>
                      <input required value={form.user} onChange={e => setForm({ ...form, user: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Password</label>
                      <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={form.ssl} onChange={e => setForm({ ...form, ssl: e.target.checked })} />
                    Use SSL
                  </label>
                </>
              )}

              {form.type === 'rest_api' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                    <input required value={form.baseUrl} onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                      placeholder="https://api.example.com"
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">API Key (optional)</label>
                    <input value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                </>
              )}

              {form.type === 'stripe' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stripe Secret Key</label>
                  <input required type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })}
                    placeholder="sk_live_..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm">
                  {saving ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
