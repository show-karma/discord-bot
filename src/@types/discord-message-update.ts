export interface DiscordSQSMessage {
  reason: string;
  userId?: number | number[];
  discordId?: string;
  publicAddress?: string;
  daos: { name: string; guildId: string }[];
  timestamp: number;
}
