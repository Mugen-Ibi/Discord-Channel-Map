export function loadConfig(env: NodeJS.ProcessEnv = process.env, setup = false) {
  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) throw new Error(`${name} is required`);
    return value;
  };
  const id = (name: string): string => {
    const value = required(name);
    if (!/^[1-9]\d{16,19}$/.test(value)) throw new Error(`${name} must be a Discord ID`);
    return value;
  };
  return {
    token: required('DISCORD_TOKEN'),
    guildId: id('GUILD_ID'),
    channelId: id('MAP_CHANNEL_ID'),
    messageId: setup ? undefined : id('MAP_MESSAGE_ID'),
  };
}

// Do not log Discord request objects: they can contain credentials or private map data.
export function logError(context: string, error: unknown): void {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  console.error(context, typeof code === 'number' ? `(Discord code ${code})` : '(check configuration, permissions and connectivity)');
}
