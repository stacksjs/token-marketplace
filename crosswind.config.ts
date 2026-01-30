import type { CrosswindConfig } from '@cwcss/crosswind'

export default {
  content: [
    './resources/**/*.{html,js,ts,jsx,tsx,stx}',
    './storage/framework/defaults/**/*.{html,js,ts,jsx,tsx,stx}',
    './storage/framework/views/**/*.{html,js,ts,jsx,tsx,stx}',
  ],
  output: './public/css/styles.css',
  preflight: true,
  minify: false,
  theme: {
    extend: {
      spacing: {
        100: '28rem',
        110: '32rem',
        116: '40rem',
        120: '44rem',
        124: '50rem',
        128: '54rem',
        400: '25rem',
        500: '31.25rem',
        'bg-height': '40rem',
      },
      colors: {
        blue: {
          4: '#010124',
          5: '#01011F',
        },
        violet: {
          1: '#DFD8ED',
          8: '#5F3EA3',
          9: '#4C3282',
        },
        gray: {
          '0.25': '#F8F8F8',
          '0.5': '#E6E6E9',
          1: '#CCCCD3',
          2: '#B3B3BE',
          3: '#9999A8',
          4: '#808092',
          5: '#67677C',
          6: '#4D4D66',
          7: '#343451',
          8: '#1A1A3B',
          9: '#010125',
          50: '#F8F8F8',
          100: '#E6E6E9',
        },
        pink: {
          1: '#FACDE2',
          2: '#F7CFDB',
          3: '#F05B88',
          8: '#E50570',
          9: '#B7045A',
          700: '#B7045A',
          'custom-2': 'rgba(247, 207, 219, 0.1)',
        },
        mint: '#10B981',
        emerald: {
          500: '#10B981',
        },
      },
      backgroundImage: {
        'gray-gradient':
          'linear-gradient(235.98deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70.2%), linear-gradient(151.99deg, rgba(1, 1, 44, 0.01) 0.44%, rgba(2, 2, 35, 0.01) 97.95%)',
        'gray-gradient-2': 'linear-gradient(112.97deg, rgba(255, 255, 255, 0.51) 3.51%, rgba(255, 255, 255, 0) 98.54%)',
        'hero-gradient': 'linear-gradient(45deg, #010123 0%, #010124 53.95%, #010125 100%)',
        'cta-gradient': 'linear-gradient(95.34deg, #010120 1.04%, #07073b 93.77%)',
        'nft-hero': "url('/images/hero-bg.webp')",
      },
      fontFamily: {
        sans: ['"Gilroy"', 'Inter', 'system-ui', 'sans-serif'],
        gilroy: ['"Gilroy"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
    },
  },
} satisfies CrosswindConfig
