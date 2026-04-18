// @ts-nocheck
import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[#7c6af7] mb-1">Dashly</h1>
        <h2 className="text-lg font-medium text-gray-400 mb-6">Reset your password</h2>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📬</div>
            <p className="text-gray-300 text-sm">If that email exists, a reset link has been sent.</p>
            <Link to="/login" className="block text-[#7c6af7] text-sm hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm transition-colors"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="mt-5 text-sm text-gray-500 text-center">
              <Link to="/login" className="text-[#7c6af7] hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
