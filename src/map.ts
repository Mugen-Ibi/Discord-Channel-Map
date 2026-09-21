import { ChannelType, escapeMarkdown, type GuildChannel } from 'discord.js';

export type MapChannel = Pick<GuildChannel, 'id' | 'name' | 'type' | 'parentId' | 'rawPosition'>;

const icons = new Map<number, string>([
  [ChannelType.GuildText, '📝'],
  [ChannelType.GuildVoice, '🔊'],
  [ChannelType.GuildForum, '💬'],
  [ChannelType.GuildAnnouncement, '📢'],
  [ChannelType.GuildStageVoice, '🎙️'],
  [ChannelType.GuildMedia, '🖼️'],
]);

// Discord places text-like channels before voice-like channels within a group.
function bucket(channel: MapChannel): number {
  return channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice ? 1 : 0;
}

export function compareChannels(a: MapChannel, b: MapChannel): number {
  return bucket(a) - bucket(b) || a.rawPosition - b.rawPosition || (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0);
}

export function generateChannelMap(channels: readonly MapChannel[]): string {
  const categories = channels.filter(c => c.type === ChannelType.GuildCategory).sort(compareChannels);
  const categoryIds = new Set(categories.map(c => c.id));
  const children = channels.filter(c => icons.has(c.type));
  const lines = ['🗺️ **チャンネルマップ**', ''];
  const append = (items: MapChannel[]) => {
    items.sort(compareChannels).forEach((c, i) => {
      lines.push(`${i === items.length - 1 ? '└─' : '├─'} ${icons.get(c.type)} <#${c.id}>`);
    });
    lines.push('');
  };
  const ungrouped = children.filter(c => !c.parentId || !categoryIds.has(c.parentId));
  if (ungrouped.length) {
    lines.push('## カテゴリなし');
    append(ungrouped);
  }
  for (const category of categories) {
    lines.push(`## 📁 ${escapeMarkdown(category.name.replace(/[\r\n]/g, ' '))}`);
    append(children.filter(c => c.parentId === category.id));
  }
  if (!children.length && !categories.length) lines.push('表示対象のチャンネルはありません。');
  const content = lines.join('\n').trimEnd();
  if (content.length > 2000) throw new Error('Channel map exceeds the 2000-character message limit');
  return content;
}
