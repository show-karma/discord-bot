export interface DiscordSQSMessage {
  reason: string;
  userId?: number | number[];
  users?: string[];
  discordId?: string;
  delegateId?: number;
  publicAddress?: string;
  daos: {
    name: string;
    guildId: string;
    channelIds: string[];
  }[];
  timestamp: number;
}
