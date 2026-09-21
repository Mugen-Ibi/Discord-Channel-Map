import { Client, Events, GatewayIntentBits } from 'discord.js';
import { loadConfig, logError } from './config.js';
import { getMapChannel } from './updateMap.js';

async function main() {
  const config = loadConfig(process.env, true);
  if (process.env.MAP_MESSAGE_ID?.trim()) throw new Error('MAP_MESSAGE_ID is already set; clear it only if intentionally replacing the map');
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.on(Events.Error, error => logError('Discord client error', error));
  const timeout = setTimeout(() => { logError('Setup timed out', null); client.destroy(); process.exitCode = 1; }, 60000);
  client.once(Events.ClientReady, async ready => {
    try {
      const channel = await getMapChannel(ready, config);
      const message = await channel.send({ content: '🗺️ チャンネルマップを準備中です。', allowedMentions: { parse: [] } });
      console.log(`MAP_MESSAGE_ID=${message.id}`);
    } catch (error) { logError('Setup failed', error); process.exitCode = 1; }
    finally { clearTimeout(timeout); client.destroy(); }
  });
  try { await client.login(config.token); }
  catch (error) { clearTimeout(timeout); client.destroy(); throw error; }
}
main().catch(error => { logError('Setup failed (check environment; MAP_MESSAGE_ID must be empty)', error); process.exitCode = 1; });
