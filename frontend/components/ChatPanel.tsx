'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { MessageDto } from '@/types';
import { Send } from 'lucide-react';

interface Props {
  messages: MessageDto[];
  myUserId: string;
  myName: string;
  onSend: (content: string) => void;
}

export default function ChatPanel({ messages, myUserId, myName, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col border-t border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2">
        <div className="codey text-[11px] uppercase tracking-widest text-ink-500">Chat</div>
        <div className="codey text-[11px] text-ink-500">{messages.length} messages</div>
      </div>

      <div
        ref={listRef}
        className="thin-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4"
        data-testid="chat-list"
      >
        {messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-500" data-testid="chat-empty">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                data-testid={`chat-message-${m.id}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? 'bg-ink-900 text-ink-50'
                      : 'bg-ink-100 text-ink-900'
                  }`}
                >
                  <div className="codey mb-0.5 text-[10px] uppercase tracking-widest opacity-70">
                    {mine ? myName : 'Peer'} ·{' '}
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-ink-200 px-3 py-3">
        <input
          className="input"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={4000}
          data-testid="chat-input"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="btn-primary disabled:opacity-50"
          data-testid="chat-send-btn"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}
