import { ChannelType, PermissionFlagsBits, type Client } from 'discord.js';
import { generateChannelMap } from './map.js';
import type { loadConfig } from './config.js';

export async function getMapChannel(client: Client<true>, config: ReturnType<typeof loadConfig>) {
  const guild = await client.guilds.fetch(config.guildId);
  const channel = await guild.channels.fetch(config.channelId);
  if (!channel || channel.type !== ChannelType.GuildText) throw new Error('MAP_CHANNEL_ID must be a text channel in GUILD_ID');
  const me = await guild.members.fetchMe();
  if (!channel.permissionsFor(me).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])) {
    throw new Error('Missing map channel permissions');
  }
  return channel;
}

export async function updateMap(client: Client<true>, config: ReturnType<typeof loadConfig>) {
  const channel = await getMapChannel(client, config);
  const guild = channel.guild;
  // Refresh roles as well, so permission changes while offline are reflected.
  await guild.roles.fetch();
  const fetched = await guild.channels.fetch();
  const me = await guild.members.fetchMe();
  const visible = [...fetched.values()].filter(c => c !== null).filter(c =>
    c.permissionsFor(me).has(PermissionFlagsBits.ViewChannel) &&
    c.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel));
  const content = generateChannelMap(visible);
  if (!config.messageId) throw new Error('MAP_MESSAGE_ID is required');
  const message = await channel.messages.fetch({ message: config.messageId, force: true });
  if (message.author.id !== client.user.id || message.webhookId) throw new Error('The map message must be authored by this bot');
  if (message.content === content) return;
  await message.edit({ content, allowedMentions: { parse: [] } });
  console.log('Channel map synchronized');
}
