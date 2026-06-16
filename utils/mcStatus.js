// Utility to query a Minecraft server using minecraft-server-util
// Exposes a function to fetch structured status info.

const { status } = require('minecraft-server-util');

/**
 * Query the Minecraft server and return a normalized result.
 * @param {string} host
 * @param {number} port
 * @param {number} timeout
 */
async function queryServer(host, port = 25565, timeout = 5000) {
  const start = Date.now();
  // Use the library's status method. It throws on failure.
  const res = await status(host, { port, timeout });
  const ping = res.roundTripLatency ?? (Date.now() - start);

  // Normalize MOTD: prefer clean text if available
  let motd = '';
  if (res.motd) {
    if (typeof res.motd === 'string') motd = res.motd;
    else motd = res.motd.clean || res.motd.raw || '';
  }

  // Favicon may be returned as data URI (data:image/png;base64,...)
  const favicon = res.favicon || null;

  return {
    online: true,
    version: (res.version && (res.version.name || res.version.protocol)) || 'Unknown',
    players: (res.players && res.players.online) ?? null,
    maxPlayers: (res.players && res.players.max) ?? null,
    motd,
    favicon,
    ping
  };
}

module.exports = { queryServer };
