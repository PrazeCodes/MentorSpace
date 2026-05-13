import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Geist"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#fafaf7',
          100: '#f4f3ee',
          200: '#e6e4d9',
          300: '#cfccbc',
          500: '#7d7a6a',
          700: '#3b3a32',
          900: '#1a1916',
        },
        accent: {
          DEFAULT: '#d96a3f',
          soft: '#f3c8b3',
        },
        moss: {
          DEFAULT: '#3f5d4a',
          soft: '#cfd9cf',
        },
      },
      boxShadow: {
        card: '0 1px 0 rgba(26,25,22,0.06), 0 8px 24px -12px rgba(26,25,22,0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
