/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // New design tokens
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        primary: 'var(--primary)',
        'primary-2': 'var(--primary-2)',
        border: 'var(--border)',
        
        // Legacy colors (for backward compatibility)
        secondary: 'var(--primary-2)',
        accent: 'var(--primary-2)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      borderRadius: {
        '2xl': 'var(--radius-2xl)',
      },
      maxWidth: {
        container: '1200px',
      },
      spacing: {
        'panel': 'var(--spacing-xl)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        // Card utility
        '.card': {
          'background': 'var(--panel)',
          'border': '1px solid var(--border)',
          'border-radius': 'var(--radius-2xl)',
          'padding': 'var(--spacing-xl)',
        },
        
        // Gradient capsule button
        '.btn-capsule': {
          'background': 'linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)',
          'color': 'var(--fg)',
          'font-weight': '600',
          'padding': '0.875rem 2rem',
          'border-radius': '9999px',
          'border': 'none',
          'cursor': 'pointer',
          'transition': 'all 0.2s ease',
          'text-decoration': 'none',
          'display': 'inline-flex',
          'align-items': 'center',
          'gap': '0.5rem',
          'font-size': 'clamp(0.9375rem, 1vw + 0.25rem, 1.125rem)',
        },
        '.btn-capsule:hover': {
          'transform': 'translateY(-2px)',
          'box-shadow': '0 10px 30px rgba(96, 165, 250, 0.3)',
        },
        '.btn-capsule:focus-visible': {
          'outline': '3px solid var(--primary)',
          'outline-offset': '3px',
          'box-shadow': '0 0 0 3px rgba(96, 165, 250, 0.4)',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '.btn-capsule:hover': {
            'transform': 'none',
          },
        },
      });
    },
  ],
}

