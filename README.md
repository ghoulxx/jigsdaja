# Minecraft Status Bot

Discord.js v14 bot that checks a single Minecraft server status and responds with a professional embed.

Setup

1. Install dependencies:

```bash
npm install
```

2. Edit `config.json` and set your `token` and `server.host`.

3. Start the bot:

```bash
npm start
```

Usage

- Use the prefix command `.status` in a server channel to get the Minecraft server status.

Features

- Displays Online/Offline, version, players, MOTD, ping, server icon (if available).
- Caches status for 15 seconds to reduce queries.
- Updates bot presence every 5 minutes with player count or offline state.
- Tracks server uptime while the bot is running and displays it in the embed.

Railway / Environment Variables

This project supports configuring via environment variables (useful for Railway). Environment variables take precedence over values in `config.json`.

- `BOT_TOKEN` - your Discord bot token
- `PREFIX` - command prefix (default `.`)
- `SERVER_HOST` - Minecraft server host/IP
- `SERVER_PORT` - Minecraft server port (default `25565`)
- `CACHE_TTL` - cache time in ms (default `15000`)
- `PRESENCE_INTERVAL` - presence update interval in ms (default `300000`)
- `BOT_NAME` - footer bot name used in embeds

On Railway, add these as project/environment variables and deploy — the bot will read them automatically.
