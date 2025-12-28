module.exports = {
  apps: [{
    name: 'edustats',
    script: 'npm',
    args: 'start',
    cwd: '/home/sean/makeit/edustats',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
}
