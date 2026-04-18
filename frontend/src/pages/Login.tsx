import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const justReset = params.get('reset') === '1';

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateEmail() {
    if (!email) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); return false; }
    setEmailError('');
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateEmail()) return;
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      setAuth(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#7c6af7] mb-1">Dashly</h1>
          <p className="text-lg font-medium text-gray-400">Sign in to your account</p>
        </div>

        {justReset && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">
            Password reset successful — sign in with your new password.
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onBlur={validateEmail} required autoFocus
              className={`w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border text-white text-sm focus:outline-none transition-colors ${
                emailError ? 'border-red-500 focus:border-red-500' : 'border-[#2a2a3a] focus:border-[#7c6af7]'
              }`}
            />
            {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-400">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#7c6af7] hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} required
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
              />
              <button
                type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-500 text-center">
          No account?{' '}
          <Link to="/signup" className="text-[#7c6af7] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
