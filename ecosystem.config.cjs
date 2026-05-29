/** PM2 process file — run from repository root on the VPS. */
module.exports = {
  apps: [
    {
      name: "finsim-api",
      cwd: "./backend",
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
