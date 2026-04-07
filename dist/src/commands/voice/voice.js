"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = exports.data = void 0;
const discord_js_1 = require("discord.js");
const settings_json_1 = __importDefault(require('../../../settings.json'));
const permissionChecker_1 = require("../../utils/permissionChecker");

exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('voice')
    .setDescription('Voice channel management commands')
    .addSubcommand(subcommand =>
        subcommand
            .setName('deafen')
            .setDescription('Deafen a user in voice channel')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to deafen')
                .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('undeafen')
            .setDescription('Undeafen a user in voice channel')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to undeafen')
                .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('mute')
            .setDescription('Mute a user in voice channel')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to mute')
                .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('unmute')
            .setDescription('Unmute a user in voice channel')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to unmute')
                .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('kick')
            .setDescription('Kick a user from voice channel')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to kick')
                .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('move')
            .setDescription('Move a user to another voice channel')
            .addUserOption(option => option
                .setName('user')
                .setDescription('User to move')
                .setRequired(true))
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('Voice channel to move user to')
                .setRequired(true)
                .addChannelTypes(discord_js_1.ChannelType.GuildVoice)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('kickall')
            .setDescription('Kick all users from your voice channel'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('muteall')
            .setDescription('Mute all users in your voice channel'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('unmuteall')
            .setDescription('Unmute all users in your voice channel'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all users in your voice channel'));

const checkPermissions = (member) => {
    return (0, permissionChecker_1.checkCommandPermissions)(member, settings_json_1.default.commands?.voice);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.voice) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.voice) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.voice) {
        locale = {
            commands: {
                voice: {
                    noPermission: "You do not have permission to use this command.",
                    notInVoice: "You must be connected to a voice channel first.",
                    userNotInVoice: "The mentioned user is not in your voice channel.",
                    userNotFound: "User not found.",
                    channelNotFound: "Voice channel not found.",
                    botMissingPerms: "I don't have the required permissions to perform this action.",
                    commandError: "An error occurred while executing the command.",
                    
                    deafen: {
                        missingPerms: "You must have `Deafen Members` permission to use this command.",
                        success: "Successfully deafened {user} in voice!",
                        error: "I was unable to deafen {user} in voice."
                    },
                    undeafen: {
                        missingPerms: "You must have `Deafen Members` permission to use this command.",
                        success: "Successfully undeafened {user} in voice!",
                        error: "I was unable to undeafen {user} in voice."
                    },
                    mute: {
                        missingPerms: "You must have `Mute Members` permission to use this command.",
                        success: "Successfully muted {user} in voice!",
                        error: "I was unable to mute {user} in voice."
                    },
                    unmute: {
                        missingPerms: "You must have `Mute Members` permission to use this command.",
                        success: "Successfully unmuted {user} in voice!",
                        error: "I was unable to unmute {user} in voice."
                    },
                    kick: {
                        missingPerms: "You must have `Move Members` permission to use this command.",
                        success: "Successfully kicked {user} from voice!",
                        error: "I was unable to kick {user} from voice."
                    },
                    move: {
                        missingPerms: "You must have `Move Members` permission to use this command.",
                        success: "Successfully moved {user} to {channel}",
                        error: "I was unable to move {user} to the channel."
                    },
                    kickall: {
                        missingPerms: "You must have `Move Members` permission to use this command.",
                        success: "Successfully kicked all members from {channel}",
                        error: "I was unable to kick members from the voice channel."
                    },
                    muteall: {
                        missingPerms: "You must have `Mute Members` permission to use this command.",
                        success: "Successfully muted all members in {channel}",
                        error: "I was unable to mute members in the voice channel."
                    },
                    unmuteall: {
                        missingPerms: "You must have `Mute Members` permission to use this command.",
                        success: "Successfully unmuted all members in {channel}",
                        error: "I was unable to unmute members in the voice channel."
                    },
                    list: {
                        title: "Users in {channel}",
                        members: "**Total Members:** {count}\n\n{members}"
                    }
                }
            }
        };
    }
    return locale;
};

exports.command = {
    name: 'voice',
    aliases: settings_json_1.default.commands?.voice?.aliases || ['vc'],
    enabled: settings_json_1.default.commands?.voice?.enabled ?? true,
    execute: async (interaction, _args, client, prefix) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = isSlash ? interaction.member : interaction.member;
            
            // Check command permissions
            if (!checkPermissions(executingMember)) {
                const noPermissionMessage = {
                    content: locale.commands.voice.noPermission,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noPermissionMessage);
                } else {
                    await interaction.reply(noPermissionMessage.content);
                }
                return;
            }

            // Check if user is in voice channel
            if (!executingMember.voice.channel) {
                const notInVoiceMessage = {
                    content: locale.commands.voice.notInVoice,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(notInVoiceMessage);
                } else {
                    await interaction.reply(notInVoiceMessage.content);
                }
                return;
            }

            let subcommand;
            let targetUser;
            let targetChannel;

            if (isSlash) {
                subcommand = interaction.options.getSubcommand();
                targetUser = interaction.options.getUser('user');
                targetChannel = interaction.options.getChannel('channel');
            } else {
                const message = interaction;
                const commandName = _args[0]?.toLowerCase();
                subcommand = commandName;
                
                const legacyMappings = {
                    'deafen': 'deafen', 'vcdef': 'deafen',
                    'undeafen': 'undeafen', 'vcundef': 'undeafen',
                    'mute': 'mute', 'voicemute': 'mute',
                    'unmute': 'unmute', 'voiceunmute': 'unmute',
                    'kick': 'kick', 'voicekick': 'kick',
                    'move': 'move', 'vc-move': 'move',
                    'kickall': 'kickall', 'voicekickall': 'kickall',
                    'muteall': 'muteall', 'voicemuteall': 'muteall',
                    'unmuteall': 'unmuteall', 'voiceunmute-all': 'unmuteall',
                    'list': 'list', 'voicelist': 'list'
                };
                
                subcommand = legacyMappings[commandName] || commandName;
                targetUser = message.mentions.members?.first()?.user;
            }

            const embed = new discord_js_1.EmbedBuilder()
                .setColor(client.color || '#0099ff')
                .setTimestamp();

            switch (subcommand) {
                case 'deafen':
                case 'undeafen':
                    if (!executingMember.permissions.has('DeafenMembers')) {
                        embed.setDescription(locale.commands.voice.deafen.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('DeafenMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!targetUser) {
                        embed.setDescription(locale.commands.voice.userNotFound);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    
                    const deafenMember = await guild.members.fetch(targetUser.id).catch(() => null);
                    if (!deafenMember?.voice.channel || deafenMember.voice.channel.id !== executingMember.voice.channel.id) {
                        embed.setDescription(locale.commands.voice.userNotInVoice);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        const shouldDeafen = subcommand === 'deafen';
                        await deafenMember.voice.setDeaf(shouldDeafen, `${executingMember.user.tag} (${executingMember.user.id})`);
                        embed.setDescription(shouldDeafen ? 
                            locale.commands.voice.deafen.success.replace('{user}', `<@${deafenMember.user.id}>`) :
                            locale.commands.voice.undeafen.success.replace('{user}', `<@${deafenMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(subcommand === 'deafen' ? 
                            locale.commands.voice.deafen.error.replace('{user}', `<@${deafenMember.user.id}>`) :
                            locale.commands.voice.undeafen.error.replace('{user}', `<@${deafenMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'mute':
                case 'unmute':
                    if (!executingMember.permissions.has('MuteMembers')) {
                        embed.setDescription(locale.commands.voice.mute.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('MuteMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!targetUser) {
                        embed.setDescription(locale.commands.voice.userNotFound);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    
                    const muteMember = await guild.members.fetch(targetUser.id).catch(() => null);
                    if (!muteMember?.voice.channel || muteMember.voice.channel.id !== executingMember.voice.channel.id) {
                        embed.setDescription(locale.commands.voice.userNotInVoice);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        const shouldMute = subcommand === 'mute';
                        await muteMember.voice.setMute(shouldMute, `${executingMember.user.tag} (${executingMember.user.id})`);
                        embed.setDescription(shouldMute ? 
                            locale.commands.voice.mute.success.replace('{user}', `<@${muteMember.user.id}>`) :
                            locale.commands.voice.unmute.success.replace('{user}', `<@${muteMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(subcommand === 'mute' ? 
                            locale.commands.voice.mute.error.replace('{user}', `<@${muteMember.user.id}>`) :
                            locale.commands.voice.unmute.error.replace('{user}', `<@${muteMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'kick':
                    if (!executingMember.permissions.has('MoveMembers')) {
                        embed.setDescription(locale.commands.voice.kick.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('MoveMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!targetUser) {
                        embed.setDescription(locale.commands.voice.userNotFound);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    
                    const kickMember = await guild.members.fetch(targetUser.id).catch(() => null);
                    if (!kickMember?.voice.channel || kickMember.voice.channel.id !== executingMember.voice.channel.id) {
                        embed.setDescription(locale.commands.voice.userNotInVoice);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        await kickMember.voice.disconnect();
                        embed.setDescription(locale.commands.voice.kick.success.replace('{user}', `<@${kickMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(locale.commands.voice.kick.error.replace('{user}', `<@${kickMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'move':
                    if (!executingMember.permissions.has('MoveMembers')) {
                        embed.setDescription(locale.commands.voice.move.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('MoveMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!targetUser) {
                        embed.setDescription(locale.commands.voice.userNotFound);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!targetChannel) {
                        embed.setDescription(locale.commands.voice.channelNotFound);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    
                    const moveMember = await guild.members.fetch(targetUser.id).catch(() => null);
                    if (!moveMember?.voice.channel) {
                        embed.setDescription(locale.commands.voice.userNotInVoice);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        await moveMember.voice.setChannel(targetChannel.id);
                        embed.setDescription(locale.commands.voice.move.success
                            .replace('{user}', `<@${moveMember.user.id}>`)
                            .replace('{channel}', `<#${targetChannel.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(locale.commands.voice.move.error.replace('{user}', `<@${moveMember.user.id}>`));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'kickall':
                    if (!executingMember.permissions.has('MoveMembers')) {
                        embed.setDescription(locale.commands.voice.kickall.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('MoveMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        const voiceChannel = executingMember.voice.channel;
                        const membersToKick = voiceChannel.members.filter(member => 
                            member.id !== executingMember.id && member.permissions.has('MoveMembers')
                        );
                        
                        for (const member of membersToKick.values()) {
                            await member.voice.disconnect().catch(() => {});
                        }
                        
                        embed.setDescription(locale.commands.voice.kickall.success.replace('{channel}', voiceChannel.name));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(locale.commands.voice.kickall.error);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'muteall':
                    if (!executingMember.permissions.has('MuteMembers')) {
                        embed.setDescription(locale.commands.voice.muteall.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('MuteMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        const voiceChannel = executingMember.voice.channel;
                        const membersToMute = voiceChannel.members.filter(member => 
                            member.id !== executingMember.id && member.permissions.has('MuteMembers')
                        );
                        
                        for (const member of membersToMute.values()) {
                            await member.voice.setMute(true).catch(() => {});
                        }
                        
                        embed.setDescription(locale.commands.voice.muteall.success.replace('{channel}', voiceChannel.name));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(locale.commands.voice.muteall.error);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'unmuteall':
                    if (!executingMember.permissions.has('MuteMembers')) {
                        embed.setDescription(locale.commands.voice.unmuteall.missingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }
                    if (!guild.members.me.permissions.has('MuteMembers')) {
                        embed.setDescription(locale.commands.voice.botMissingPerms);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                        return;
                    }

                    try {
                        const voiceChannel = executingMember.voice.channel;
                        const membersToUnmute = voiceChannel.members.filter(member => 
                            member.permissions.has('MuteMembers')
                        );
                        
                        for (const member of membersToUnmute.values()) {
                            await member.voice.setMute(false).catch(() => {});
                        }
                        
                        embed.setDescription(locale.commands.voice.unmuteall.success.replace('{channel}', voiceChannel.name));
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    } catch (error) {
                        embed.setDescription(locale.commands.voice.unmuteall.error);
                        await reply(interaction, { embeds: [embed] }, isSlash);
                    }
                    break;

                case 'list':
                    const voiceChannel = executingMember.voice.channel;
                    const members = voiceChannel.members.map(m => `${m.user.tag} | <@${m.user.id}>`).join('\n');
                    
                    embed.setTitle(locale.commands.voice.list.title.replace('{channel}', voiceChannel.name))
                         .setDescription(locale.commands.voice.list.members
                             .replace('{count}', voiceChannel.members.size.toString())
                             .replace('{members}', members || 'No members in voice channel'));
                    await reply(interaction, { embeds: [embed] }, isSlash);
                    break;

                default:
                    // Show help if no valid subcommand
                    const helpEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(client.color || '#0099ff')
                        .setTitle('Voice Commands')
                        .setDescription('Available voice channel management commands:')
                        .addFields(
                            { name: '👤 User Management', value: '`deafen`, `undeafen`, `mute`, `unmute`, `kick`, `move`' },
                            { name: '👥 Bulk Management', value: '`kickall`, `muteall`, `unmuteall`' },
                            { name: '📋 Information', value: '`list`' }
                        )
                        .setTimestamp();
                    await reply(interaction, { embeds: [helpEmbed] }, isSlash);
                    break;
            }

        } catch (error) {
            console.error('Error executing voice command:', error);
            const errorMessage = {
                content: locale.commands.voice.commandError,
                flags: 1 << 6
            };
            if (interaction instanceof discord_js_1.ChatInputCommandInteraction) {
                if (!interaction.replied) {
                    await interaction.reply(errorMessage);
                } else {
                    await interaction.followUp(errorMessage);
                }
            } else {
                await interaction.reply(errorMessage.content);
            }
        }
    }
};
async function reply(interaction, content, isSlash) {
    if (isSlash) {
        if (interaction.replied) {
            await interaction.followUp(content);
        } else {
            await interaction.reply(content);
        }
    } else {
        await interaction.reply(content);
    }
}