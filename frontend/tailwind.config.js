/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {}, // Déjalo vacío para tener todos los colores (zinc, amber, etc.)
  },
  plugins: [],
}