import { Client, Events, GatewayIntentBits } from 'discord.js';
import { loadConfig, logError } from './config.js';
import { createScheduler } from './scheduler.js';
import { updateMap } from './updateMap.js';

async function main() {
  const config = loadConfig();
  const client = new Client({ intents: [GatewayIntentBits.Guilds], allowedMentions: { parse: [] } });
  const scheduler = createScheduler(async () => {
    if (!client.isReady()) throw new Error('Gateway is not ready');
    await updateMap(client, config);
  }, error => logError('Map update failed; retrying. Check message ownership/ID, permissions, length (2000 max) and connection.', error));
  const changed = (guildId: string) => { if (guildId === config.guildId) scheduler.request(); };
  client.on(Events.ChannelCreate, channel => changed(channel.guild.id));
  client.on(Events.ChannelDelete, channel => { if ('guild' in channel) changed(channel.guild.id); });
  client.on(Events.ChannelUpdate, (_old, channel) => { if ('guild' in channel) changed(channel.guild.id); });
  client.on(Events.GuildRoleUpdate, (_old, role) => changed(role.guild.id));
  client.on(Events.GuildRoleDelete, role => changed(role.guild.id));
  client.on(Events.GuildAvailable, guild => { if (guild.id === config.guildId) scheduler.request(true); });
  client.on(Events.ClientReady, () => { console.log('Bot ready'); scheduler.request(true); });
  client.on(Events.ShardResume, () => scheduler.request(true));
  client.on(Events.Error, error => logError('Discord client error', error));
  client.on(Events.ShardError, error => logError('Discord connection error', error));
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { scheduler.stop(); client.destroy(); });
  }
  try { await client.login(config.token); }
  catch (error) { scheduler.stop(); client.destroy(); throw error; }
}

main().catch(error => { logError('Bot startup failed', error); process.exitCode = 1; });
