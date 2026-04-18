import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Widget {
  id: string;
  title: string;
  type: string;
  config: any;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
}

export default function DashboardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newWidget, setNewWidget] = useState({ title: '', type: 'chart' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  async function fetchDashboard() {
    if (!id) return;
    try {
      const { data } = await api.get(`/dashboards/${id}`);
      setDashboard(data.dashboard);
      setWidgets(data.widgets);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function addWidget(e: React.FormEvent) {
    e.preventDefault();
    if (!newWidget.title.trim() || !id) return;

    setCreating(true);
    try {
      const { data } = await api.post('/widgets', {
        dashboardId: id,
        title: newWidget.title,
        type: newWidget.type,
        config: {}
      });
      setWidgets([...widgets, data.widget]);
      setNewWidget({ title: '', type: 'chart' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add widget');
    } finally {
      setCreating(false);
    }
  }

  async function deleteWidget(widgetId: string) {
    try {
      await api.delete(`/widgets/${widgetId}`);
      setWidgets(widgets.filter(w => w.id !== widgetId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete widget');
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-400">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="flex justify-center items-center h-screen text-gray-400">Dashboard not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => navigate('/dashboards')} className="text-[#7c6af7] hover:underline text-sm mb-2">
            ← Back to Dashboards
          </button>
          <h1 className="text-3xl font-bold text-white">{dashboard.name}</h1>
          {dashboard.description && <p className="text-gray-400 mt-1">{dashboard.description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="col-span-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add Widget</h2>
          {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}

          <form onSubmit={addWidget} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Widget title</label>
                <input
                  type="text"
                  value={newWidget.title}
                  onChange={e => setNewWidget({ ...newWidget, title: e.target.value })}
                  placeholder="e.g., Revenue Chart"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newWidget.type}
                  onChange={e => setNewWidget({ ...newWidget, type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                >
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
                  <option value="stat">Statistic</option>
                  <option value="gauge">Gauge</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !newWidget.title.trim()}
              className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm transition-colors"
            >
              {creating ? 'Adding...' : 'Add Widget'}
            </button>
          </form>
        </div>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Widget Count</h2>
          <div className="text-4xl font-bold text-[#7c6af7]">{widgets.length}</div>
          <p className="text-gray-400 text-sm mt-2">Widgets on this dashboard</p>
        </div>
      </div>

      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Widgets</h2>
        {widgets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No widgets yet. Add one above!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map(w => (
              <div key={w.id} className="bg-[#0f0f18] border border-[#2a2a3a] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{w.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Type: {w.type}</p>
                  </div>
                  <button
                    onClick={() => deleteWidget(w.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
                  <div>Size: {w.width}x{w.height}</div>
                  <div>Pos: ({w.x}, {w.y})</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
