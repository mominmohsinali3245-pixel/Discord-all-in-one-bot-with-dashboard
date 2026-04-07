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
    .setName('purgebots')
    .setDescription('Delete bot messages from the channel')
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Number of bot messages to delete (1-99)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(99));

const checkPermissions = (member) => {
    return (0, permissionChecker_1.checkCommandPermissions)(member, settings_json_1.default.commands?.purgebots);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.purgebots) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.purgebots) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.purgebots) {
        locale = {
            commands: {
                purgebots: {
                    title: "Purge Bot Messages",
                    description: "Delete bot messages from the channel",
                    noPermission: "You do not have permission to use this command.",
                    missingManageMessages: "You must have `Manage Messages` permissions to use this command.",
                    botMissingPermissions: "I must have `Manage Messages`, `Read Message History` permissions to use this command.",
                    amountTooHigh: "Maximum **99** bot messages can be purged at a time.",
                    success: "Successfully deleted {count} bot messages.",
                    noMessages: "There were no bot messages to purge.",
                    unableToDelete: "I was unable to delete the messages",
                    commandError: "An error occurred while executing the command.",
                    requestedBy: "Requested by {user}"
                }
            }
        };
    }
    return locale;
};

exports.command = {
    name: 'purgebots',
    aliases: settings_json_1.default.commands?.purgebots?.aliases || ['clearbots', 'c bots'],
    enabled: settings_json_1.default.commands?.purgebots?.enabled ?? true,
    execute: async (interaction, _args, client) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = isSlash ? interaction.member : interaction.member;
            
            // Check command permissions
            if (!checkPermissions(executingMember)) {
                const noPermissionMessage = {
                    content: locale.commands.purgebots.noPermission,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noPermissionMessage);
                } else {
                    await interaction.reply(noPermissionMessage.content);
                }
                return;
            }

            // Check user has Manage Messages permission
            if (!executingMember.permissions.has('ManageMessages')) {
                const noManageMessages = {
                    content: locale.commands.purgebots.missingManageMessages,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noManageMessages);
                } else {
                    await interaction.reply(noManageMessages.content);
                }
                return;
            }

            // Check bot permissions
            const botMember = guild?.members.me;
            if (!botMember?.permissions.has(['ManageMessages', 'ReadMessageHistory'])) {
                const botMissingPerms = {
                    content: locale.commands.purgebots.botMissingPermissions,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(botMissingPerms);
                } else {
                    await interaction.reply(botMissingPerms.content);
                }
                return;
            }

            let amount;
            if (isSlash) {
                amount = interaction.options.getInteger('amount') || 99;
            } else {
                amount = parseInt(_args[0]) || 99;
            }

            // Validate amount
            if (amount > 99) {
                const tooHighMessage = {
                    content: locale.commands.purgebots.amountTooHigh,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(tooHighMessage);
                } else {
                    await interaction.reply(tooHighMessage.content);
                }
                return;
            }

            // Execute purge using your existing utility
            const response = await client.util.purgeMessages(
                executingMember, 
                isSlash ? interaction.channel : interaction.channel, 
                "BOT", 
                amount
            );

            const embed = new discord_js_1.EmbedBuilder()
                .setColor(client.color || '#0099ff')
                .setFooter({
                    text: locale.commands.purgebots.requestedBy.replace('{user}', 
                        isSlash ? interaction.user.tag : interaction.author.tag)
                })
                .setTimestamp();

            let replyContent;
            if (typeof response === "number") {
                embed.setDescription(locale.commands.purgebots.success.replace('{count}', response.toString()));
                replyContent = { embeds: [embed] };
            } else if (response === "BOT_PERM") {
                replyContent = {
                    content: locale.commands.purgebots.botMissingPermissions,
                    flags: 1 << 6
                };
            } else if (response === "MEMBER_PERM") {
                replyContent = {
                    content: locale.commands.purgebots.missingManageMessages,
                    flags: 1 << 6
                };
            } else if (response === "NO_MESSAGES") {
                embed.setDescription(locale.commands.purgebots.noMessages);
                replyContent = { embeds: [embed], flags: 1 << 6 };
            } else {
                embed.setDescription(locale.commands.purgebots.unableToDelete);
                replyContent = { embeds: [embed], flags: 1 << 6 };
            }

            if (isSlash) {
                if (interaction.replied) {
                    await interaction.followUp(replyContent);
                } else {
                    await interaction.reply(replyContent);
                }
            } else {
                await interaction.reply(replyContent);
            }

        } catch (error) {
            console.error('Error executing purgebots command:', error);
            const errorMessage = {
                content: locale.commands.purgebots.commandError,
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