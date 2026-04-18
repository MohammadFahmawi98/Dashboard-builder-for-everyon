import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function Dashboards() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboards();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  async function fetchDashboards() {
    try {
      const { data } = await api.get('/dashboards');
      setDashboards(data.dashboards);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  }

  async function createDashboard(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/dashboards', { name: newName, description: newDesc });
      setDashboards([data.dashboard, ...dashboards]);
      setNewName('');
      setNewDesc('');
      setSuccess('Dashboard created');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create dashboard');
    } finally {
      setCreating(false);
    }
  }

  async function deleteDashboard(id: string) {
    if (!confirm('Delete this dashboard?')) return;
    try {
      await api.delete(`/dashboards/${id}`);
      setDashboards(dashboards.filter(d => d.id !== id));
      setSuccess('Dashboard deleted');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete dashboard');
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboards</h1>
        <p className="text-gray-400">Create and manage your data dashboards</p>
      </div>

      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Create New Dashboard</h2>
        {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 px-4 py-2 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">{success}</div>}

        <form onSubmit={createDashboard} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dashboard name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Sales Overview"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm transition-colors"
          >
            {creating ? 'Creating...' : 'Create Dashboard'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-gray-400">Loading dashboards...</div>
        ) : dashboards.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">
            No dashboards yet. Create one to get started!
          </div>
        ) : (
          dashboards.map(d => (
            <div key={d.id} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#7c6af7] transition-colors">
              <h3 className="text-white font-semibold mb-2">{d.name}</h3>
              {d.description && <p className="text-sm text-gray-400 mb-3">{d.description}</p>}
              <p className="text-xs text-gray-500 mb-4">Created {new Date(d.created_at).toLocaleDateString()}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/dashboards/${d.id}`)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white text-sm font-medium transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={() => deleteDashboard(d.id)}
                  className="px-3 py-2 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
