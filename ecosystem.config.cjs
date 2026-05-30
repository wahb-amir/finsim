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
      // This tells PM2 to inject the variables from your .env file
      env: {
        NODE_ENV: "production",
        PORT: 8081,
      },
      // Explicitly tell PM2 to load your local .env file variables
      dot_env: "/root/finsim/backend/.env" 
    },
  ],
};