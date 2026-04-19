// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import api from '../api/client';
import WidgetRenderer from '../components/WidgetRenderer';

interface Tile {
  id: string;
  query_id: string | null;
  viz_type: string;
  config: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
}

interface Query {
  id: string;
  query_text: string;
}

const VIZ_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'number', label: 'Number' },
  { value: 'table', label: 'Table' },
];

const COLS = 12;

export default function DashboardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Tile | null>(null);
  const [width, setWidth] = useState(1000);

  const [form, setForm] = useState({ viz_type: 'bar', query_id: '', xKey: '', yKey: '', label: '' });

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    const onResize = () => setWidth(Math.min(window.innerWidth - 280, 1400));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 2500); return () => clearTimeout(t); }
  }, [success]);

  async function load() {
    if (!id) return;
    try {
      const [d, q] = await Promise.all([api.get(`/dashboards/${id}`), api.get('/queries')]);
      setDashboard(d.data.dashboard);
      setTiles(d.data.tiles || []);
      setQueries(q.data.queries || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ viz_type: 'bar', query_id: '', xKey: '', yKey: '', label: '' });
    setShowAdd(true);
  }

  function openEdit(t: Tile) {
    setEditing(t);
    setForm({
      viz_type: t.viz_type,
      query_id: t.query_id || '',
      xKey: t.config?.xKey || '',
      yKey: t.config?.yKey || '',
      label: t.config?.label || ''
    });
    setShowAdd(true);
  }

  async function saveTile(e: React.FormEvent) {
    e.preventDefault();
    const config: any = {};
    if (form.xKey) config.xKey = form.xKey;
    if (form.yKey) config.yKey = form.yKey;
    if (form.label) config.label = form.label;
    try {
      if (editing) {
        const { data } = await api.put(`/widgets/${editing.id}`, {
          vizType: form.viz_type,
          queryId: form.query_id || null,
          config,
        });
        setTiles(tiles.map(t => t.id === editing.id ? { ...t, ...data.widget } : t));
        setSuccess('Tile updated');
      } else {
        const { data } = await api.post('/widgets', {
          dashboardId: id,
          vizType: form.viz_type,
          queryId: form.query_id || null,
          config,
          positionX: 0, positionY: tiles.length * 4,
          width: 6, height: 4
        });
        setTiles([...tiles, data.widget]);
        setSuccess('Tile added');
      }
      setShowAdd(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    }
  }

  async function deleteTile(tileId: string) {
    if (!confirm('Delete this tile?')) return;
    try {
      await api.delete(`/widgets/${tileId}`);
      setTiles(tiles.filter(t => t.id !== tileId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  }

  async function onLayoutChange(layout: any[]) {
    // Persist new positions (debounced would be nicer)
    const updates = layout.map(l => {
      const t = tiles.find(x => x.id === l.i);
      if (!t) return null;
      if (t.position_x === l.x && t.position_y === l.y && t.width === l.w && t.height === l.h) return null;
      return { id: t.id, x: l.x, y: l.y, w: l.w, h: l.h };
    }).filter(Boolean);
    if (updates.length === 0) return;
    setTiles(tiles.map(t => {
      const u = updates.find((x: any) => x.id === t.id);
      return u ? { ...t, position_x: u.x, position_y: u.y, width: u.w, height: u.h } : t;
    }));
    for (const u of updates) {
      api.put(`/widgets/${u.id}`, { positionX: u.x, positionY: u.y, width: u.w, height: u.h }).catch(() => {});
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-400">Loading dashboard…</div>;
  if (!dashboard) return <div className="flex justify-center items-center h-screen text-gray-400">Dashboard not found</div>;

  const layout = tiles.map(t => ({
    i: t.id, x: t.position_x, y: t.position_y, w: t.width, h: t.height, minW: 2, minH: 2
  }));

  return (
    <div className="p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/dashboards')} className="text-[#7c6af7] hover:underline text-sm mb-2">
            ← Back to Dashboards
          </button>
          <h1 className="text-3xl font-bold text-white">{dashboard.name}</h1>
          {dashboard.description && <p className="text-gray-400 mt-1 text-sm">{dashboard.description}</p>}
        </div>
        <button onClick={openAdd}
          className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white font-semibold text-sm">
          + Add Tile
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 px-4 py-2 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">{success}</div>}

      {tiles.length === 0 ? (
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-16 text-center">
          <p className="text-gray-400 mb-4">This dashboard has no tiles yet</p>
          <button onClick={openAdd}
            className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white font-semibold text-sm">
            Add your first tile
          </button>
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={layout}
          cols={COLS}
          rowHeight={60}
          width={width}
          onLayoutChange={onLayoutChange}
          draggableHandle=".tile-handle"
          compactType="vertical"
        >
          {tiles.map(t => (
            <div key={t.id} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl overflow-hidden flex flex-col">
              <div className="tile-handle cursor-move px-3 py-2 border-b border-[#2a2a3a] flex items-center justify-between bg-[#13131c]">
                <span className="text-xs font-semibold text-gray-300 capitalize">{t.viz_type}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="text-xs text-[#7c6af7] hover:text-[#a395ff]">Edit</button>
                  <button onClick={() => deleteTile(t.id)} className="text-xs text-red-400 hover:text-red-300">×</button>
                </div>
              </div>
              <div className="flex-1 min-h-0 p-2">
                <WidgetRenderer tile={t} />
              </div>
            </div>
          ))}
        </GridLayout>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Tile' : 'New Tile'}</h2>
            <form onSubmit={saveTile} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Visualization</label>
                <select value={form.viz_type} onChange={e => setForm({ ...form, viz_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm">
                  {VIZ_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Query</label>
                <select value={form.query_id} onChange={e => setForm({ ...form, query_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm">
                  <option value="">— None —</option>
                  {queries.map(q => <option key={q.id} value={q.id}>{q.query_text.slice(0, 50)}</option>)}
                </select>
              </div>
              {['bar', 'line', 'area', 'pie'].includes(form.viz_type) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">X column</label>
                    <input value={form.xKey} onChange={e => setForm({ ...form, xKey: e.target.value })}
                      placeholder="auto"
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Y column</label>
                    <input value={form.yKey} onChange={e => setForm({ ...form, yKey: e.target.value })}
                      placeholder="auto"
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                </div>
              )}
              {form.viz_type === 'number' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Column</label>
                    <input value={form.yKey} onChange={e => setForm({ ...form, yKey: e.target.value })}
                      placeholder="auto"
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Label (optional)</label>
                    <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm" />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white font-semibold text-sm">
                  {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
