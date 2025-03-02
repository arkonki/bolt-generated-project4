/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        fantasy: ['MedievalSharp', 'fantasy'],
        serif: ['Crimson Text', 'serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            h1: {
              fontFamily: 'MedievalSharp, fantasy',
            },
            h2: {
              fontFamily: 'MedievalSharp, fantasy',
            },
            h3: {
              fontFamily: 'MedievalSharp, fantasy',
            },
            p: {
              fontFamily: 'Crimson Text, serif',
            },
          },
        },
      },
      screens: {
        'xs': '475px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
