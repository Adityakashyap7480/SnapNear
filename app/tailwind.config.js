const { platformSelect } = require('nativewind/theme');
const brand = require('./src/theme/brand');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Expo web + NativeWind: default "media" throws when the runtime syncs the
  // document color scheme. Class mode keeps the app light unless .dark is set.
  darkMode: 'class',
  theme: {
    extend: {
      colors: { brand },
      fontFamily: {
        // Native builds register Inter/Outfit per weight (see app.config.ts); web loads them from Google Fonts
        sans: platformSelect({ web: "'Inter', ui-sans-serif, system-ui, sans-serif", default: 'Inter' }),
        display: platformSelect({ web: "'Outfit', ui-sans-serif, system-ui, sans-serif", default: 'Outfit' }),
      },
    },
  },
  plugins: [],
};
