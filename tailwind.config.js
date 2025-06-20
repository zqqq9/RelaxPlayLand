/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'apple-blue': '#007AFF',
        'apple-green': '#34C759',
        'apple-orange': '#FF9500',
        'apple-red': '#FF3B30',
        'apple-purple': '#AF52DE',
        'apple-pink': '#FF2D92',
        'apple-gray': '#8E8E93',
        'apple-light-gray': '#F2F2F7',
        'apple-dark-gray': '#1C1C1E',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 