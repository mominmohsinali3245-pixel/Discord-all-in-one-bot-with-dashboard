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
    .setName('membercount')
    .setDescription('Get detailed member statistics for this server');

const checkPermissions = (member) => {
    return (0, permissionChecker_1.checkCommandPermissions)(member, settings_json_1.default.commands?.membercount);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.membercount) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.membercount) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.membercount) {
        locale = {
            commands: {
                membercount: {
                    title: "Member Count",
                    author: "{botName} MemberCount Panel",
                    guildTitle: "{guildName} - Member Statistics",
                    totalMembers: "Total Members",
                    humans: "Humans",
                    bots: "Bots",
                    online: "Online",
                    idle: "Idle",
                    dnd: "Do Not Disturb",
                    offline: "Offline",
                    requestedBy: "Requested by {user}",
                    noPermission: "You do not have permission to use this command.",
                    commandError: "An error occurred while executing the command."
                }
            }
        };
    }
    return locale;
};

exports.command = {
    name: 'membercount',
    aliases: settings_json_1.default.commands?.membercount?.aliases || ['mc', 'mcount'],
    enabled: settings_json_1.default.commands?.membercount?.enabled ?? true,
    execute: async (interaction, _args, client, prefix) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = isSlash ? interaction.member : interaction.member;
            
            // Check command permissions
            if (!checkPermissions(executingMember)) {
                const noPermissionMessage = {
                    content: locale.commands.membercount.noPermission,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noPermissionMessage);
                } else {
                    await interaction.reply(noPermissionMessage.content);
                }
                return;
            }

            if (!guild) {
                const noGuildMessage = {
                    content: "This command can only be used in a server.",
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noGuildMessage);
                } else {
                    await interaction.reply(noGuildMessage.content);
                }
                return;
            }

            // Fetch all members to ensure cache is populated
            await guild.members.fetch();

            // Calculate member statistics
            const totalMembers = guild.members.cache.size;
            const humans = guild.members.cache.filter(member => !member.user.bot).size;
            const bots = guild.members.cache.filter(member => member.user.bot).size;
            
            // Presence statistics
            const online = guild.members.cache.filter(member => 
                member.presence?.status === 'online'
            ).size;
            const idle = guild.members.cache.filter(member => 
                member.presence?.status === 'idle'
            ).size;
            const dnd = guild.members.cache.filter(member => 
                member.presence?.status === 'dnd'
            ).size;
            const offline = guild.members.cache.filter(member => 
                !member.presence || member.presence?.status === 'offline'
            ).size;

            const embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ 
                    name: locale.commands.membercount.author.replace('{botName}', client.user.username), 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setColor(client.color || "#2f3136")
                .setFooter({ 
                    text: locale.commands.membercount.requestedBy.replace('{user}', 
                        isSlash ? interaction.user.username : interaction.author.username),
                    iconURL: isSlash ? interaction.user.displayAvatarURL() : interaction.author.displayAvatarURL()
                })
                .setTitle(locale.commands.membercount.guildTitle.replace('{guildName}', guild.name))
                .setThumbnail(guild.iconURL({ size: 256 }))
                .addFields(
                    {
                        name: `👥 ${locale.commands.membercount.totalMembers}`,
                        value: `**${totalMembers.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: `👤 ${locale.commands.membercount.humans}`,
                        value: `**${humans.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: `🤖 ${locale.commands.membercount.bots}`,
                        value: `**${bots.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '📊 Status',
                        value: `🟢 **${locale.commands.membercount.online}:** ${online.toLocaleString()}\n🟡 **${locale.commands.membercount.idle}:** ${idle.toLocaleString()}\n🔴 **${locale.commands.membercount.dnd}:** ${dnd.toLocaleString()}\n⚫ **${locale.commands.membercount.offline}:** ${offline.toLocaleString()}`,
                        inline: false
                    }
                )
                .setTimestamp();

            if (isSlash) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error executing membercount command:', error);
            const errorMessage = {
                content: locale.commands.membercount.commandError,
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