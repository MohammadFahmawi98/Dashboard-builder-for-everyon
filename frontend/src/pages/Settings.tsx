import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Settings() {
  const { user, setAuth, token } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => { if (profileMsg) { const t = setTimeout(() => setProfileMsg(''), 3000); return () => clearTimeout(t); } }, [profileMsg]);
  useEffect(() => { if (pwdMsg) { const t = setTimeout(() => setPwdMsg(''), 3000); return () => clearTimeout(t); } }, [pwdMsg]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileErr(''); setProfileMsg('');
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { name, email });
      setAuth(token!, data.user);
      setProfileMsg('Profile updated successfully');
    } catch (err: any) {
      setProfileErr(err.response?.data?.error || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwdErr(''); setPwdMsg('');
    if (newPwd !== confirmPwd) { setPwdErr('Passwords do not match'); return; }
    if (newPwd.length < 8) { setPwdErr('Password must be at least 8 characters'); return; }
    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword: oldPwd, newPassword: newPwd });
      setPwdMsg('Password changed successfully');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      setPwdErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Profile */}
      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        {profileMsg && <div className="mb-3 px-4 py-2 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">{profileMsg}</div>}
        {profileErr && <div className="mb-3 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{profileErr}</div>}
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7c6af7] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500">{user?.plan} plan</span>
          </div>
          <button type="submit" disabled={profileLoading}
            className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {profileLoading ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
        {pwdMsg && <div className="mb-3 px-4 py-2 rounded-lg bg-green-950 border border-green-800 text-green-400 text-sm">{pwdMsg}</div>}
        {pwdErr && <div className="mb-3 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">{pwdErr}</div>}
        <form onSubmit={changePassword} className="space-y-4">
          {[
            { label: 'Current password', val: oldPwd, set: setOldPwd },
            { label: 'New password', val: newPwd, set: setNewPwd },
            { label: 'Confirm new password', val: confirmPwd, set: setConfirmPwd },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="password" value={val} onChange={e => set(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f18] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
          ))}
          <button type="submit" disabled={pwdLoading}
            className="px-5 py-2 rounded-lg bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {pwdLoading ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}
