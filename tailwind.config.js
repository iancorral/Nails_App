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
        'salon-bg': '#FDFCF8',       
        'salon-brown': '#3E311D',    
        'salon-lavender': '#E8A3D8', 
        'salon-yellow': '#FBEF97',   
        'salon-olive': '#96A053',    
        'salon-terracotta': '#C87966', 
        'salon-gray': '#9A948B',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}