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

  // Normalize port: accept number, numeric string, or object { port: number }
  let portNum = port;
  if (typeof port === 'object' && port !== null) {
    // try common fields
    if (typeof port.port !== 'undefined') portNum = port.port;
    else if (typeof port.number !== 'undefined') portNum = port.number;
  }
  // coerce numeric strings
  if (typeof portNum === 'string') portNum = parseInt(portNum, 10);

  if (typeof portNum !== 'number' || Number.isNaN(portNum)) {
    throw new TypeError(`Invalid port value: ${JSON.stringify(port)} (expected number)`);
  }

  // Use the library's status method. It throws on failure.
  const res = await status(host, { port: portNum, timeout });
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
