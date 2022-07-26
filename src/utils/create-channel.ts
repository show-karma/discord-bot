export const createChannel = async (client, interaction) => {
  const interactionChannel = await interaction.guild.channels.create(
    `interaction-${interaction.user.username}`,
    {
      topic: interaction.user.id,
      permissionOverwrites: [
        {
          id: interaction.user.id,
          allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        },
        {
          id: interaction.guild.roles.everyone,
          deny: ['VIEW_CHANNEL']
        }
      ],
      type: 'GUILD_TEXT'
    }
  );
};
