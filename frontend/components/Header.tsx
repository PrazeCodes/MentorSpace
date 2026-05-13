'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
          data-testid="header-brand"
        >
          <div className="h-7 w-7 rounded-full bg-ink-900" />
          <span className="font-display text-xl tracking-tight">MentorSpace</span>
        </button>
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden text-right md:block" data-testid="header-user">
              <div className="text-sm text-ink-900">{user.name}</div>
              <div className="codey text-[11px] uppercase tracking-widest text-ink-500">
                {user.role}
              </div>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.replace('/');
            }}
            className="btn-ghost"
            data-testid="header-logout-btn"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
