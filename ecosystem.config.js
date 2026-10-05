module.exports = {
  apps: [{
    name: "gemoradimserver",
    script: "app.js",
    watch: true,
    ignore_watch: ["node_modules", "invoices"],
    env: {
      "NODE_ENV": "development",
    },
    env_production: {
      "NODE_ENV": "production",
    }
  }]
}