// Load configuration with environment variable overrides (for Railway and other hosts)
const path = require('path');

// Load defaults from config.json
const defaults = require(path.join(__dirname, '..', 'config.json'));

// Helper to parse integers from env with fallback
function parseIntEnv(name, fallback) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

const config = {
  token: process.env.BOT_TOKEN || defaults.token,
  prefix: process.env.PREFIX || defaults.prefix,
  server: {
    host: process.env.SERVER_HOST || (defaults.server && defaults.server.host),
    port: parseIntEnv('SERVER_PORT', defaults.server && defaults.server.port)
  },
  cacheTTL: parseIntEnv('CACHE_TTL', defaults.cacheTTL || 15000),
  presenceInterval: parseIntEnv('PRESENCE_INTERVAL', defaults.presenceInterval || 300000),
  botName: process.env.BOT_NAME || defaults.botName || 'Minecraft Status Bot'
};

module.exports = config;
