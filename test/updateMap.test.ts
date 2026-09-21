import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChannelType, type Client } from 'discord.js';
import { updateMap } from '../src/updateMap.js';

function fixture() {
  const edits: unknown[] = [];
  const me = { id: 'bot' };
  const everyone = { id: 'everyone' };
  const config = { token: 'test', guildId: 'guild', channelId: 'map', messageId: 'message' };
  const message = { author: { id: 'bot' }, webhookId: null as string | null, content: '', edit: async (payload: unknown) => { edits.push(payload); } };
  const entries = new Map<string, unknown>();
  const guild = {
    members: { fetchMe: async () => me },
    roles: { everyone, fetch: async () => undefined },
    channels: { fetch: async (id?: string) => id ? target : entries },
  };
  const target = { guild, type: ChannelType.GuildText, permissionsFor: () => ({ has: () => true }), messages: { fetch: async () => message } };
  const client = { user: me, guilds: { fetch: async () => guild } } as unknown as Client<true>;
  const add = (id: string, publiclyVisible: boolean) => entries.set(id, {
    id, name: 'private name', type: ChannelType.GuildText, parentId: null, rawPosition: 0,
    permissionsFor: (subject: unknown) => ({ has: () => subject === everyone ? publiclyVisible : true }),
  });
  return { client, config, message, edits, add, entries };
}

test('updates only the configured message, filters private channels, suppresses mentions, skips identical content', async () => {
  const f = fixture();
  f.add('11', true);
  f.add('12', false);
  await updateMap(f.client, f.config);
  assert.equal(f.edits.length, 1);
  const payload = f.edits[0] as { content: string; allowedMentions: { parse: unknown[] } };
  assert.ok(payload.content.includes('<#11>'));
  assert.ok(!payload.content.includes('<#12>'));
  assert.deepEqual(payload.allowedMentions, { parse: [] });
  f.message.content = payload.content;
  await updateMap(f.client, f.config);
  assert.equal(f.edits.length, 1);
});

test('refuses messages from another author or a webhook', async () => {
  const f = fixture();
  f.message.author.id = 'someone-else';
  await assert.rejects(updateMap(f.client, f.config), /authored by this bot/);
  f.message.author.id = 'bot';
  f.message.webhookId = 'webhook';
  await assert.rejects(updateMap(f.client, f.config), /authored by this bot/);
  assert.equal(f.edits.length, 0);
});

test('keeps existing message when map is too large', async () => {
  const f = fixture();
  for (let i = 0; i < 100; i++) f.add(String(100000000000000000n + BigInt(i)), true);
  await assert.rejects(updateMap(f.client, f.config), /2000/);
  assert.equal(f.edits.length, 0);
});
