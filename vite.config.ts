import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // puerto fijo: el depurador de VS Code (.vscode/launch.json) abre esta URL
  server: { port: 5180, strictPort: true },
})
