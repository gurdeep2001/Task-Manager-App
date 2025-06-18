export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
} 