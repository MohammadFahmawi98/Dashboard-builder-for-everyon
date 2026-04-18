import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import { useAuth } from '../context/AuthContext';

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

export default function Signup() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  function validateName() {
    if (!name.trim()) { setNameError('Full name is required'); return false; }
    setNameError(''); return true;
  }
  function validateEmail() {
    if (!email) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); return false; }
    setEmailError(''); return true;
  }
  function validatePassword() {
    if (password.length < 8) { setPasswordError('Password must be at least 8 characters'); return false; }
    setPasswordError(''); return true;
  }
  function validateConfirm() {
    if (confirm !== password) { setConfirmError('Passwords do not match'); return false; }
    setConfirmError(''); return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = [validateName(), validateEmail(), validatePassword(), validateConfirm()].every(Boolean);
    if (!ok) return;
    setError('');
    setLoading(true);
    try {
      const { token, user } = await signup(email, password, name);
      setAuth(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = 'w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border text-white text-sm focus:outline-none transition-colors';
  const inputOk = 'border-[#2a2a3a] focus:border-[#7c6af7]';
  const inputErr = 'border-red-500 focus:border-red-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#7c6af7] mb-1">Dashly</h1>
          <p className="text-lg font-medium text-gray-400">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              onBlur={validateName} required autoFocus
              className={`${inputBase} ${nameError ? inputErr : inputOk}`}
            />
            {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onBlur={validateEmail} required
              className={`${inputBase} ${emailError ? inputErr : inputOk}`}
            />
            {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} onBlur={validatePassword} required
                className={`${inputBase} pr-10 ${passwordError ? inputErr : inputOk}`}
              />
              <button
                type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-[#2a2a3a]'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{strength.label}</p>
              </div>
            )}
            {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)} onBlur={validateConfirm} required
              className={`${inputBase} ${confirmError ? inputErr : inputOk}`}
            />
            {confirmError && <p className="mt-1 text-xs text-red-400">{confirmError}</p>}
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#7c6af7] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
