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
        primary: '#3B82F6',
        emerald: '#10B981',
        // Semantic aliases used by the status-badge system and shared
        // components — map to the same underlying Tailwind palette so
        // existing bg-emerald-*/bg-red-* etc. classes keep working.
        success: {
          DEFAULT: '#10B981',
          subtle: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          subtle: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#EF4444',
          subtle: '#FEE2E2',
        },
        info: {
          DEFAULT: '#3B82F6',
          subtle: '#DBEAFE',
        },
        neutral: {
          DEFAULT: '#6B7280',
          subtle: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Spacing scale: additive tokens beyond Tailwind's default 0.25rem
      // steps, named for common layout roles rather than raw sizes so
      // components can express intent (gutter, section gap) consistently.
      spacing: {
        gutter: '1rem',
        section: '2rem',
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
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config
