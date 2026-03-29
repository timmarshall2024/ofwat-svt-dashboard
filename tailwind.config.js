/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'fs-primary':        'var(--fs-primary)',
        'fs-primary-light':  'var(--fs-primary-light)',
        'fs-primary-dark':   'var(--fs-primary-dark)',
        'fs-secondary':      'var(--fs-secondary)',
        'fs-secondary-light':'var(--fs-secondary-light)',
        'fs-surface':        'var(--fs-surface)',
        'fs-highlight':      'var(--fs-highlight)',
        'fs-border':         'var(--fs-border)',
        'fs-text':           'var(--fs-text-primary)',
        'fs-text-muted':     'var(--fs-text-secondary)',
        'fs-success':        'var(--fs-success)',
        'fs-warning':        'var(--fs-warning)',
      },
      fontFamily: {
        heading: ['var(--fs-font-heading)', 'serif'],
        body:    ['var(--fs-font-body)',    'serif'],
      },
      borderRadius: {
        'fs-sm': 'var(--fs-radius-sm)',
        'fs-md': 'var(--fs-radius-md)',
        'fs-lg': 'var(--fs-radius-lg)',
      },
      boxShadow: {
        'fs':    'var(--fs-shadow)',
        'fs-md': 'var(--fs-shadow-md)',
      },
    },
  },
  plugins: [],
}
