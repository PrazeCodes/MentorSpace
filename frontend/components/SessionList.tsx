'use client';

import { useRouter } from 'next/navigation';
import type { SessionDto } from '@/types';

export default function SessionList({ sessions }: { sessions: SessionDto[] }) {
  const router = useRouter();
  if (sessions.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-ink-500" data-testid="sessions-empty">
        No sessions yet. Create one or join with a code to get started.
      </div>
    );
  }
  return (
    <div className="card divide-y divide-ink-200" data-testid="session-list">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => router.push(`/session/${s.id}`)}
          className="flex w-full items-center justify-between gap-6 px-6 py-4 text-left hover:bg-ink-100"
          data-testid={`session-row-${s.id}`}
        >
          <div>
            <div className="codey text-xs uppercase tracking-widest text-ink-500">
              {new Date(s.createdAt).toLocaleString()}
            </div>
            <div className="mt-1 font-display text-lg">
              Session <span className="codey">{s.joinCode}</span>
            </div>
          </div>
          <StatusBadge status={s.status} />
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: SessionDto['status'] }) {
  const map: Record<SessionDto['status'], { text: string; classes: string }> = {
    WAITING: { text: 'Waiting', classes: 'bg-ink-100 text-ink-700' },
    ACTIVE: { text: 'Active', classes: 'bg-moss-soft text-moss' },
    ENDED: { text: 'Ended', classes: 'bg-accent-soft text-ink-900' },
  };
  const { text, classes } = map[status];
  return (
    <span
      className={`codey rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${classes}`}
      data-testid={`session-status-${status.toLowerCase()}`}
    >
      {text}
    </span>
  );
}
