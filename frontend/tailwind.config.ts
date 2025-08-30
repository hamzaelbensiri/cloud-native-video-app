import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E50914',
          redHover: '#F6121D',
          surface: '#0b0b0f',   // page bg
          card: '#111318',      // cards/panels
          line: '#1f232b'       // borders / hairlines
        }
      },
      borderRadius: {
        '2xl': '1rem'
      },
      boxShadow: {
        card: '0 10px 30px -15px rgba(0,0,0,0.6)'
      },
      backgroundImage: {
        // subtle red glow vignette you can apply with bg-radial-vignette
        'radial-vignette':
          'radial-gradient(1200px 600px at 50% -150px, rgba(229, 9, 20, 0.18), transparent 60%)'
      }
    }
  },
  plugins: []
} satisfies Config;
