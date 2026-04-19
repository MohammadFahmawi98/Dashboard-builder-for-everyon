// @ts-nocheck
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/client';

const COLORS = ['#7c6af7', '#4ade80', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981'];

interface TileProps {
  tile: {
    id: string;
    query_id: string | null;
    viz_type: string;
    config: any;
  };
}

export default function WidgetRenderer({ tile }: TileProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!tile.query_id) return;
    setLoading(true);
    setError('');
    api.post(`/queries/${tile.query_id}/run`, {})
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed'))
      .finally(() => setLoading(false));
  }, [tile.query_id]);

  if (!tile.query_id) {
    return <div className="h-full flex items-center justify-center text-gray-500 text-sm">No query attached</div>;
  }
  if (loading) return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="h-full flex items-center justify-center text-red-400 text-sm p-3 text-center">{error}</div>;
  if (!data || !data.rows?.length) return <div className="h-full flex items-center justify-center text-gray-500 text-sm">No data</div>;

  const cfg = tile.config || {};
  const xKey = cfg.xKey || data.columns[0];
  const yKey = cfg.yKey || data.columns[1] || data.columns[0];

  switch (tile.viz_type) {
    case 'number':
      return <NumberViz rows={data.rows} column={yKey} label={cfg.label} />;
    case 'table':
      return <TableViz rows={data.rows} columns={data.columns} />;
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey={xKey} stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
            <Bar dataKey={yKey} fill="#7c6af7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey={xKey} stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
            <Line type="monotone" dataKey={yKey} stroke="#7c6af7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey={xKey} stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
            <Area type="monotone" dataKey={yKey} stroke="#7c6af7" fill="#7c6af7" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.rows} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius="70%" label>
              {data.rows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    default:
      return <TableViz rows={data.rows} columns={data.columns} />;
  }
}

function NumberViz({ rows, column, label }: any) {
  const val = rows[0]?.[column];
  const display = typeof val === 'number' ? val.toLocaleString() : String(val ?? '—');
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="text-4xl font-bold text-[#7c6af7]">{display}</div>
      {label && <div className="text-sm text-gray-400 mt-2">{label}</div>}
    </div>
  );
}

function TableViz({ rows, columns }: any) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="bg-[#0f0f18] sticky top-0">
          <tr>
            {columns.map((c: string) => <th key={c} className="px-3 py-2 text-left text-gray-400 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((r: any, i: number) => (
            <tr key={i} className="border-t border-[#2a2a3a]">
              {columns.map((c: string) => (
                <td key={c} className="px-3 py-1.5 text-gray-300 whitespace-nowrap">
                  {r[c] == null ? <span className="text-gray-600">null</span> : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
