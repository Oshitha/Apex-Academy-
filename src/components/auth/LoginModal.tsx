import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { StaffUser } from '../../types';
import { ShieldCheck, Lock, User, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: StaffUser) => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storage.login(username, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleQuickLogin = (roleUsername: string) => {
    const res = storage.login(roleUsername, 'admin123');
    if (res.success && res.user) {
      onLoginSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Staff & Admin Secure Sign-In</h2>
          <p className="text-xs text-slate-500 mt-1">
            Role-based authentication with cryptographic audit tracking
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Username / ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. admin or staff"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors"
          >
            Authenticate Credentials
          </button>
        </form>

        {/* 1-Click Role Switchers for Demo Evaluation */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 block mb-2 text-center uppercase tracking-wider">
            Quick 1-Click Role Logins:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-all text-xs"
            >
              <span className="font-bold text-slate-900 block truncate">Admin</span>
              <span className="text-[10px] text-indigo-600 font-mono">Full Access</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff')}
              className="p-2 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-all text-xs"
            >
              <span className="font-bold text-slate-900 block truncate">Staff / Gate</span>
              <span className="text-[10px] text-emerald-600 font-mono">Scanning & Fees</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('teacher')}
              className="p-2 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition-all text-xs"
            >
              <span className="font-bold text-slate-900 block truncate">Teacher</span>
              <span className="text-[10px] text-amber-600 font-mono">Grading & AL/OL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
