import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      navigate('/login?reset=1');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[#7c6af7] mb-1">Dashly</h1>
        <h2 className="text-lg font-medium text-gray-400 mb-6">Set a new password</h2>

        {!token && <p className="text-red-400 text-sm">Invalid or missing reset token.</p>}

        {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">New password</label>
            <input
              type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm password</label>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
            />
          </div>
          <button
            type="submit" disabled={loading || !token}
            className="w-full py-2.5 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
        <p className="mt-5 text-sm text-gray-500 text-center">
          <Link to="/login" className="text-[#7c6af7] hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
