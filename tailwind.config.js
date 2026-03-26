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