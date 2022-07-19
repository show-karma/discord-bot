import { Interaction } from 'discord.js';

export interface CustomInteraction extends Interaction {
  reply?: (text: string) => void;
}
