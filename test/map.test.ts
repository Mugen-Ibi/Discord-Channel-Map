import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChannelType } from 'discord.js';
import { generateChannelMap, type MapChannel } from '../src/map.js';
import { loadConfig } from '../src/config.js';

const channel = (id: string, type: MapChannel['type'], rawPosition = 0, parentId: string | null = null, name = 'category'): MapChannel => ({ id, type, rawPosition, parentId, name });

test('groups channels in Discord order, text before voice, ties by snowflake', () => {
  const content = generateChannelMap([
    channel('20', ChannelType.GuildCategory, 2), channel('10', ChannelType.GuildCategory, 1),
    channel('31', ChannelType.GuildVoice, 0, '10'), channel('33', ChannelType.GuildText, 5, '10'),
    channel('32', ChannelType.GuildAnnouncement, 5, '10'), channel('34', ChannelType.GuildForum, 0, '20'),
    channel('30', ChannelType.GuildText),
  ]);
  const references = [...content.matchAll(/<#(\d+)>/g)].map(m => m[1]);
  assert.deepEqual(references, ['30', '32', '33', '31', '34']);
  for (const icon of ['📝', '🔊', '💬', '📢']) assert.ok(content.includes(icon));
});

test('handles empty categories, escaped names and missing parents without exposing their names', () => {
  const content = generateChannelMap([channel('10', ChannelType.GuildCategory, 0, null, '*title*'), channel('11', ChannelType.GuildText, 0, 'hidden')]);
  assert.ok(content.includes('\\*title\\*'));
  assert.ok(content.includes('カテゴリなし'));
  assert.ok(!content.includes('hidden'));
  assert.ok(generateChannelMap([]).includes('表示対象のチャンネルはありません'));
});

test('refuses oversized maps instead of truncating or posting extra messages', () => {
  assert.throws(() => generateChannelMap(Array.from({ length: 100 }, (_, i) => channel(String(100000000000000000n + BigInt(i)), ChannelType.GuildText))), /2000/);
});

test('configuration validates required values, while setup permits absent message ID', () => {
  const env = { DISCORD_TOKEN: 'test-only', GUILD_ID: '123456789012345678', MAP_CHANNEL_ID: '123456789012345679' };
  assert.throws(() => loadConfig(env), /MAP_MESSAGE_ID/);
  assert.equal(loadConfig(env, true).messageId, undefined);
  assert.throws(() => loadConfig({ ...env, GUILD_ID: 'bad' }, true), /GUILD_ID/);
});
