import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MentorSpace — 1-on-1 mentorship, live',
  description: 'Code, chat, and meet — in one focused room. Built for mentors and learners.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink-50 text-ink-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
