'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AuthForm from '@/components/AuthForm';
import { Code2, MessagesSquare, Video } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      router.replace('/dashboard');
    }
  }, [hydrated, token, router]);

  return (
    <main className="grain-bg min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2" data-testid="brand-mark">
          <div className="h-8 w-8 rounded-full bg-ink-900" />
          <span className="font-display text-2xl tracking-tight">MentorSpace</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-ink-700 md:flex">
          <a href="#features" className="hover:text-ink-900">Features</a>
          <a href="#how" className="hover:text-ink-900">How it works</a>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-8 pb-24 pt-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center">
          <p className="codey mb-6 inline-flex items-center gap-2 self-start rounded-full border border-ink-200 bg-white px-3 py-1 text-xs uppercase tracking-widest text-ink-700">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            1-on-1 mentorship, live
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink-900 md:text-6xl lg:text-7xl">
            Code together.<br />
            Talk it through.<br />
            <span className="text-accent">In one room.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-ink-700 md:text-lg">
            MentorSpace gives mentors and students a focused space: a shared editor,
            real-time chat, and 1-on-1 video — joined by a single 6-character code.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-700">
              <span className="inline-flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Shared Monaco editor
              </span>
              <span className="inline-flex items-center gap-2">
                <MessagesSquare className="h-4 w-4" /> Persistent chat
              </span>
              <span className="inline-flex items-center gap-2">
                <Video className="h-4 w-4" /> WebRTC video
              </span>
            </div>
          </div>
        </div>

        <div className="lg:pl-8">
          <AuthForm />
        </div>
      </section>

      <section id="features" className="dots-bg border-t border-ink-200 bg-ink-100">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-20 md:grid-cols-3">
          <Feature
            title="One room, everything together"
            body="No tabs, no swapping. Code editor, video, and chat sit side-by-side so attention never breaks."
          />
          <Feature
            title="Built on plain WebRTC"
            body="Peer-to-peer audio and video. We never see your media — only signaling traverses the server."
          />
          <Feature
            title="Sync that survives reloads"
            body="Chat and code persist to the database, so reconnecting picks up exactly where you left off."
          />
        </div>
      </section>

      <footer className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6 text-sm text-ink-500">
          <span>© {new Date().getFullYear()} MentorSpace</span>
          <span className="codey">v0.1 · MVP</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}
