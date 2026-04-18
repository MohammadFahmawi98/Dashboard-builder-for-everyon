import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-400 mt-1 text-sm">Here's what's happening with your dashboards.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Dashboards', value: '0', sub: 'No dashboards yet' },
          { label: 'Queries', value: '0', sub: 'No queries yet' },
          { label: 'Connectors', value: '0', sub: 'No connectors yet' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">▦</div>
        <h2 className="text-lg font-semibold text-white mb-2">Create your first dashboard</h2>
        <p className="text-sm text-gray-400 mb-4">Connect a data source and start building beautiful dashboards.</p>
        <button className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] text-white font-semibold text-sm transition-colors">
          + New Dashboard
        </button>
      </div>
    </div>
  );
}
