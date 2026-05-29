module.exports = {
  apps: [
    {
      name: "finsim-api",
      cwd: "/root/finsim/backend",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8081
      }
    }
  ]
};