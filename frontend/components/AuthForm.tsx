'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { AuthResponse, Role } from '@/types';

type Mode = 'login' | 'signup';

export default function AuthForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login'
        ? { email, password }
        : { email, name, password, role };
      const res = await api.post<AuthResponse>(path, body);
      setAuth(res.data.token, res.data.refreshToken, res.data.user);
      router.replace('/dashboard');
    } catch (err: unknown) {
      let msg = 'Something went wrong';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message
          || (err.response?.data?.fields && Object.values(err.response.data.fields)[0] as string)
          || err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8" data-testid="auth-card">
      <div className="mb-6 flex items-center gap-1 rounded-full border border-ink-200 bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          data-testid="tab-login"
          className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
            mode === 'login' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-700 hover:text-ink-900'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          data-testid="tab-signup"
          className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
            mode === 'signup' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-700 hover:text-ink-900'
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
        {mode === 'signup' && (
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-ink-500">Full name</label>
            <input
              data-testid="signup-name-input"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="Ada Lovelace"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-ink-500">Email</label>
          <input
            data-testid="auth-email-input"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@studio.dev"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-ink-500">Password</label>
          <input
            data-testid="auth-password-input"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="at least 8 characters"
          />
        </div>

        {mode === 'signup' && (
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-ink-500">I am a…</label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              <RolePill
                active={role === 'STUDENT'}
                onClick={() => setRole('STUDENT')}
                label="Student"
                hint="Joining with a code"
                testId="role-student"
              />
              <RolePill
                active={role === 'MENTOR'}
                onClick={() => setRole('MENTOR')}
                label="Mentor"
                hint="Creating sessions"
                testId="role-mentor"
              />
            </div>
          </div>
        )}

        {error && (
          <div
            data-testid="auth-error"
            className="rounded-xl border border-accent/40 bg-accent-soft/40 px-3 py-2 text-sm text-ink-900"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="auth-submit-btn"
          className="btn-accent w-full disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

function RolePill({
  active,
  onClick,
  label,
  hint,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      role="radio"
      aria-checked={active}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        active
          ? 'border-ink-900 bg-ink-900 text-ink-50'
          : 'border-ink-200 bg-white text-ink-900 hover:border-ink-300'
      }`}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className={`text-xs ${active ? 'text-ink-200' : 'text-ink-500'}`}>{hint}</div>
    </button>
  );
}
