module.exports = {
  apps: [{
    name: "catur-backend",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 4000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M"
  }]
};
