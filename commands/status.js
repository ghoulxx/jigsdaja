const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mc = require('../utils/mcStatus');
const cache = require('../utils/cache');
const config = require('../utils/configLoader');

// TTL for cache in ms
const TTL = config.cacheTTL ?? 15000;

/**
 * Build a professional embed for the server status when online.
 * @param {object} info
 * @param {string} host
 * @returns {object} { embed, files }
 */
function msToDuration(ms) {
  if (!ms || ms <= 0) return 'N/A';
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}

function buildOnlineEmbed(info, host, client) {
  const percent = info.maxPlayers ? Math.round((info.players / info.maxPlayers) * 100) : null;
  const playersText = info.maxPlayers
    ? `${info.players}/${info.maxPlayers} (${percent}% full)`
    : `${info.players ?? 'N/A'}`;

  const embed = new EmbedBuilder()
    .setTitle('Minecraft Server Status')
    .setColor(0x2ecc71) // Green
    .addFields(
      { name: '🟢 Status', value: 'Online', inline: true },
      { name: '🌐 Server IP', value: `${host}:${(config.server && config.server.port) || '25565'}`, inline: true },
      { name: '📦 Version', value: `${info.version}`, inline: true },
      { name: '👥 Players', value: playersText, inline: true },
      { name: '📡 Ping', value: `${Math.round(info.ping)}ms`, inline: true },
      { name: '📜 MOTD', value: info.motd || 'None', inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `${config.botName || 'Minecraft Status Bot'}` });

  // Add uptime field if available from client tracking
  try {
    const onlineSince = client && client.serverStatus && client.serverStatus.onlineSince;
    if (onlineSince) {
      const uptimeStr = msToDuration(Date.now() - onlineSince);
      embed.addFields({ name: '⏱️ Uptime', value: uptimeStr, inline: true });
    }
  } catch (e) {
    // ignore
  }

  const files = [];
  if (info.favicon) {
    // favicon is usually a data URI: data:image/png;base64,<base64>
    try {
      const base64 = info.favicon.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const attachment = new AttachmentBuilder(buffer, { name: 'favicon.png' });
      files.push(attachment);
      embed.setThumbnail('attachment://favicon.png');
    } catch (err) {
      // ignore favicon parsing errors
    }
  }

  return { embed, files };
}

/**
 * Build an embed for when the server is offline or unreachable.
 * @param {string} host
 * @param {string} reason
 */
function buildOfflineEmbed(host, reason = 'Connection Failed') {
  const embed = new EmbedBuilder()
    .setTitle('Minecraft Server Status')
    .setColor(0xe74c3c) // Red
    .addFields(
      { name: '🔴 Status', value: 'Offline', inline: true },
      { name: '🌐 Server IP', value: `${host}:${(config.server && config.server.port) || '25565'}`, inline: true },
      { name: '❌ Connection Failed', value: `${reason}` }
    )
    .setTimestamp()
    .setFooter({ text: `${config.botName || 'Minecraft Status Bot'}` });

  return { embed, files: [] };
}

module.exports = {
  name: 'status',
  description: 'Check Minecraft server status',
  /**
   * Execute the .status command
   * @param {Client} client
   * @param {Message} message
   */
  run: async (client, message) => {
    const host = config.server.host;

    // Attempt to use cached data first
    const cached = cache.getCached(TTL);
    if (cached) {
      if (cached.online) {
        const { embed, files } = buildOnlineEmbed(cached, host, client);
        // send with attachments if present
        return message.channel.send({ embeds: [embed], files });
      } else {
        const { embed } = buildOfflineEmbed(host, cached.error || 'Connection Failed');
        return message.channel.send({ embeds: [embed] });
      }
    }

    // No cached data; query the server
    try {
      const info = await mc.queryServer(host, config.server.port, 5000);
      // store in cache
      cache.setCached(info);

      const { embed, files } = buildOnlineEmbed(info, host, client);
      return message.channel.send({ embeds: [embed], files });
    } catch (err) {
      // On error, cache offline state briefly to prevent hammering
      cache.setCached({ online: false, error: err.message || String(err) });
      const { embed } = buildOfflineEmbed(host, err.message || 'Connection Failed');
      return message.channel.send({ embeds: [embed] });
    }
  }
};
