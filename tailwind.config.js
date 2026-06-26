/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'float-ambient',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Texto general de la interfaz (Century Gothic). Tailwind aplica
        // fontFamily.sans al <html>, así que esto define la tipografía base.
        sans: [
          '"Century Gothic"',
          'CenturyGothic',
          'Questrial',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        // Solo marca y títulos display grandes (Boston Angel). Con fallback a la
        // base para degradar de forma elegante mientras no esté el archivo de fuente.
        title: [
          '"Boston Angel"',
          '"Century Gothic"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        'salon-bg': '#FAF7F2',
        'salon-brown': '#2C1F0E',      // más oscuro, casi negro cálido
        'salon-black': '#1a1a1a',      // negro puro para botones
        'salon-lavender': '#D4609C',   // más saturado
        'salon-yellow': '#F9E040',     // más saturado
        'salon-olive': '#6B7135',      // más saturado
        'salon-terracotta': '#C4522A', // más saturado
        'salon-gray': '#7A746C',       // más definido
        'salon-pink' : '#C4789A',
        'salon-white' : '#FFFFFF'
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}