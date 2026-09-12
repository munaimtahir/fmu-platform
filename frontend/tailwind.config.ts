import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Breakpoints are Tailwind's defaults, made explicit here so the scale
    // is documented in one place rather than left implicit:
    // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
    extend: {
      colors: {
        // Full scale (not a single hex) so components can express
        // hover/active/subtle states via tokens instead of falling back to
        // raw Tailwind classes like `hover:bg-blue-600`.
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#4F46E5',
        },
        // Semantic aliases used by the status-badge system and shared
        // components. Each has a subtle background, a DEFAULT accent, and an
        // emphasis color for text on a subtle background — this is what
        // Badge.tsx's variant map is rewritten to consume instead of raw
        // Tailwind color classes.
        success: {
          subtle: '#D1FAE5',
          DEFAULT: '#059669',
          emphasis: '#065F46',
        },
        warning: {
          subtle: '#FEF3C7',
          DEFAULT: '#D97706',
          emphasis: '#92400E',
        },
        danger: {
          subtle: '#FEE2E2',
          DEFAULT: '#DC2626',
          emphasis: '#991B1B',
        },
        info: {
          subtle: '#E0F2FE',
          DEFAULT: '#0284C7',
          emphasis: '#075985',
        },
        neutral: {
          subtle: '#F1F5F9',
          DEFAULT: '#64748B',
          emphasis: '#334155',
        },
        // Page/card background and border, replacing scattered literals
        // like `bg-[#FAFAFA]`.
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        // Text hierarchy, replacing scattered `text-gray-900`/`text-gray-500`.
        ink: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Named type scale (paired size/line-height) consolidating the
      // inconsistent ad hoc combos found across pages (text-4xl/3xl/2xl
      // font-bold all used for what should be one "page title" role, etc.)
      // into fixed steps. Consumed by components/ui/Typography.tsx.
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h4: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        body: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      // Spacing scale: additive tokens beyond Tailwind's default 0.25rem
      // steps, named for common layout roles rather than raw sizes so
      // components can express intent (gutter, section gap) consistently.
      spacing: {
        gutter: '1rem',
        section: '2rem',
        'stack-sm': '0.5rem',
        'stack-md': '1.5rem',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        // Elevation scale: 1 = resting card, 2 = raised/hover, 3 = modal/popover
        'elevation-1': '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        'elevation-2': '0 4px 8px -2px rgb(15 23 42 / 0.12), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
        'elevation-3': '0 12px 24px -6px rgb(15 23 42 / 0.18), 0 4px 8px -4px rgb(15 23 42 / 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config
