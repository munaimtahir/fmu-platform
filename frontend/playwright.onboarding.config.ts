import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/onboarding',
  workers: 1,
  timeout: 180000,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5189', trace: 'retain-on-failure' },
  webServer: [
    { command: '../backend/.venv/bin/python ../backend/scripts/onboarding_e2e_server.py', url: 'http://127.0.0.1:8021/api/health/', timeout: 120000 },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5189 --strictPort', url: 'http://127.0.0.1:5189', env: { VITE_PROXY_TARGET: 'http://127.0.0.1:8021', VITE_API_URL: '/' }, timeout: 60000 },
  ],
})
