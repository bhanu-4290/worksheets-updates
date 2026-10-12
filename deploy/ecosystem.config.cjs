module.exports = {
  apps: [
    {
      name: "worktrack-api",
      script: "dist/index.js",
      cwd: "./server",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        USE_SYSTEM_POSTGRES: "true",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
      },
    },
  ],
};
