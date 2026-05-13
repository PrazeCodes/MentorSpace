'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Header from '@/components/Header';
import SessionList from '@/components/SessionList';
import type { SessionDto } from '@/types';
import { Plus, KeyRound } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionDto[] | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/');
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    api.get<SessionDto[]>('/api/sessions/my')
      .then((r) => setSessions(r.data))
      .catch(() => setSessions([]));
  }, [token]);

  if (!user) return null;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<SessionDto>('/api/sessions/create');
      router.push(`/session/${r.data.id}`);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  const join = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const code = joinCode.trim().toUpperCase();
      const r = await api.post<SessionDto>('/api/sessions/join', { joinCode: code });
      router.push(`/session/${r.data.id}`);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50" data-testid="dashboard">
      <Header />
      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-10">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            Hi, {user.name.split(' ')[0]}.
          </h1>
          <p className="mt-2 text-ink-700">
            {user.role === 'MENTOR'
              ? 'Spin up a fresh room and share the code with your student.'
              : 'Got a code from your mentor? Drop it in to jump into the room.'}
          </p>
        </div>

        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {user.role === 'MENTOR' ? (
            <div className="card flex flex-col gap-4 p-6">
              <div>
                <div className="codey text-xs uppercase tracking-widest text-ink-500">
                  Start a session
                </div>
                <h2 className="mt-1 font-display text-2xl">Create a new room</h2>
                <p className="mt-1 text-sm text-ink-700">
                  You&apos;ll get a 6-character join code to share with your student.
                </p>
              </div>
              <button
                onClick={create}
                disabled={busy}
                className="btn-primary self-start disabled:opacity-60"
                data-testid="create-session-btn"
              >
                <Plus className="h-4 w-4" />
                {busy ? 'Creating…' : 'Create session'}
              </button>
            </div>
          ) : (
            <form onSubmit={join} className="card flex flex-col gap-4 p-6" data-testid="join-form">
              <div>
                <div className="codey text-xs uppercase tracking-widest text-ink-500">
                  Join a session
                </div>
                <h2 className="mt-1 font-display text-2xl">Have a join code?</h2>
                <p className="mt-1 text-sm text-ink-700">
                  Enter the 6-character code your mentor shared.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="input codey uppercase tracking-widest"
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  required
                  data-testid="join-code-input"
                />
                <button
                  type="submit"
                  disabled={busy || joinCode.length !== 6}
                  className="btn-accent disabled:opacity-60"
                  data-testid="join-session-btn"
                >
                  <KeyRound className="h-4 w-4" /> Join room
                </button>
              </div>
            </form>
          )}

          <div className="card p-6">
            <div className="codey text-xs uppercase tracking-widest text-ink-500">Your account</div>
            <div className="mt-3 grid gap-3">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role} />
            </div>
          </div>
        </section>

        {error && (
          <div
            data-testid="dashboard-error"
            className="mb-6 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3 text-sm text-ink-900"
          >
            {error}
          </div>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl">Past sessions</h2>
            <span className="codey text-xs uppercase tracking-widest text-ink-500">
              {sessions?.length ?? 0} total
            </span>
          </div>
          {sessions === null ? (
            <div className="card p-8 text-sm text-ink-500" data-testid="sessions-loading">
              Loading…
            </div>
          ) : (
            <SessionList sessions={sessions} />
          )}
        </section>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0 last:pb-0">
      <div className="codey text-[11px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message
      || (err.response?.data?.fields && Object.values(err.response.data.fields)[0] as string)
      || err.message;
  }
  return 'Something went wrong';
}
