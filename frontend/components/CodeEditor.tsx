'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
  value: string;
  onChange: (v: string) => void;
  loaded: boolean;
}

export default function CodeEditor({ value, onChange, loaded }: Props) {
  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth' as const,
      padding: { top: 12, bottom: 12 },
      wordWrap: 'on' as const,
    }),
    []
  );

  return (
    <div className="flex h-full flex-col border-l border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2">
        <div className="codey text-[11px] uppercase tracking-widest text-ink-500">
          Shared code
        </div>
        <div className="codey text-[11px] text-ink-500">{loaded ? 'Synced' : 'Loading…'}</div>
      </div>
      <div className="flex-1 overflow-hidden" data-testid="code-editor">
        <Monaco
          height="100%"
          defaultLanguage="javascript"
          value={value}
          onChange={(v) => onChange(v ?? '')}
          theme="vs-light"
          options={options}
        />
      </div>
    </div>
  );
}
