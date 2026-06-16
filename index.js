// Main bot entrypoint
// Loads commands, handles messages (prefix-based), updates presence, and tracks server uptime.

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./utils/configLoader');
const cache = require('./utils/cache');
const mc = require('./utils/mcStatus');

// Create the Discord client with required intents for prefix commands
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// Simple commands collection
client.commands = new Map();

// Uptime tracking: timestamp when server became online (while bot running)
let serverOnlineSince = null;

// Helper to load commands from commands/ folder
function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd && cmd.name) client.commands.set(cmd.name, cmd);
  }
}

// Update bot presence every configured interval with server state
async function updatePresence() {
  try {
    // Try cached first
    let info = cache.getCached(config.cacheTTL || 15000);
    if (!info) {
      try {
        info = await mc.queryServer(config.server.host, config.server.port, 5000);
        cache.setCached(info);
      } catch (err) {
        info = { online: false };
      }
    }

    // Manage serverOnlineSince tracking
    if (info.online) {
      if (!serverOnlineSince) serverOnlineSince = Date.now();
      const players = info.players ?? 0;
      await client.user.setPresence({ activities: [{ name: `🟢 ${players} players online` }], status: 'online' });
    } else {
      serverOnlineSince = null;
      await client.user.setPresence({ activities: [{ name: `🔴 Server Offline` }], status: 'idle' });
    }
  } catch (err) {
    // Swallow presence errors to avoid crashing
    console.error('Presence update failed', err);
  }
}

// Load commands
loadCommands();

// On ready: log and start presence updater
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Initial presence update
  await updatePresence();
  // Repeat every X ms
  setInterval(updatePresence, config.presenceInterval || 300000);
});

// Message handler for prefix commands
client.on('messageCreate', async (message) => {
  try {
    if (!message.guild) return; // ignore DMs
    if (message.author.bot) return; // ignore bots

    const prefix = config.prefix || '.';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    await command.run(client, message, args);
  } catch (err) {
    console.error('Command handler error', err);
  }
});

// Expose a small status API for commands to read uptime
client.serverStatus = {
  get onlineSince() {
    return serverOnlineSince;
  }
};

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// Login the bot
if (!config.token || config.token === 'YOUR_BOT_TOKEN_HERE') {
  console.warn('No bot token provided in config.json; please set "token" before starting.');
} else {
  client.login(config.token).catch(err => console.error('Failed to login:', err));
}
