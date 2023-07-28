export interface DiscordSQSMessage {
  reason: string;
  userId?: number | number[];
  users?: string[];
  discordId?: string;
  publicAddress?: string;
  daoName?: string;
  daos: {
    name: string;
    guildId: string;
    channelIds: string[];
  }[];
  timestamp: number;
}
