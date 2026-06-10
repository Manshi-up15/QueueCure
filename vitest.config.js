import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.js'],
    env: {
      DATABASE_PATH: 'server/data/queuecure.test.db',
      NODE_ENV: 'test',
    },
  },
})
