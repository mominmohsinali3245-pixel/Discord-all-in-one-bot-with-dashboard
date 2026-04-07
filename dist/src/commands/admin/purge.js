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
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Number of messages to delete (1-99)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(99));

const checkPermissions = (member) => {
    return (0, permissionChecker_1.checkCommandPermissions)(member, settings_json_1.default.commands?.purge);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.purge) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.purge) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.purge) {
        locale = {
            commands: {
                purge: {
                    title: "Purge Messages",
                    description: "Delete multiple messages from the channel",
                    noPermission: "You do not have permission to use this command.",
                    missingManageMessages: "You must have `Manage Messages` permissions to use this command.",
                    invalidAmount: "You must provide a valid number of messages to delete.",
                    amountTooHigh: "You can't delete more than **99** messages at a time.",
                    success: "Successfully deleted {amount} messages.",
                    commandError: "An error occurred while executing the command.",
                    requestedBy: "Requested by {user}"
                }
            }
        };
    }
    return locale;
};

const deleteMessages = async (channel, amount) => {
    for (let i = amount; i > 0; i -= 100) {
        if (i > 100) {
            await channel.bulkDelete(100).catch(() => { });
        } else {
            await channel.bulkDelete(i).catch(() => { });
        }
    }
};

exports.command = {
    name: 'purge',
    aliases: settings_json_1.default.commands?.purge?.aliases || ['clear', 'purne'],
    enabled: settings_json_1.default.commands?.purge?.enabled ?? true,
    execute: async (interaction, _args, client) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = isSlash ? interaction.member : interaction.member;
            
            // Check command permissions
            if (!checkPermissions(executingMember)) {
                const noPermissionMessage = {
                    content: locale.commands.purge.noPermission,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noPermissionMessage);
                } else {
                    await interaction.reply(noPermissionMessage.content);
                }
                return;
            }

            // Check Manage Messages permission
            if (!executingMember.permissions.has('ManageMessages')) {
                const noManageMessages = {
                    content: locale.commands.purge.missingManageMessages,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noManageMessages);
                } else {
                    await interaction.reply(noManageMessages.content);
                }
                return;
            }

            let amount;
            if (isSlash) {
                amount = interaction.options.getInteger('amount');
            } else {
                const message = interaction;
                amount = parseInt(_args[0]);
            }

            // Validate amount
            if (!amount || isNaN(amount)) {
                const invalidAmountMessage = {
                    content: locale.commands.purge.invalidAmount,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(invalidAmountMessage);
                } else {
                    await interaction.reply(invalidAmountMessage.content);
                }
                return;
            }

            if (amount > 99) {
                const tooHighMessage = {
                    content: locale.commands.purge.amountTooHigh,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(tooHighMessage);
                } else {
                    await interaction.reply(tooHighMessage.content);
                }
                return;
            }

            // Delete messages
            const channel = isSlash ? interaction.channel : interaction.channel;
            
            if (!isSlash) {
                await interaction.delete().catch(() => { });
            }

            await deleteMessages(channel, amount);

            const successEmbed = new discord_js_1.EmbedBuilder()
                .setColor(client.color || '#0099ff')
                .setDescription(locale.commands.purge.success.replace('{amount}', amount.toString()))
                .setFooter({
                    text: locale.commands.purge.requestedBy.replace('{user}', 
                        isSlash ? interaction.user.tag : interaction.author.tag)
                })
                .setTimestamp();

            if (isSlash) {
                await interaction.reply({ embeds: [successEmbed], flags: 1 << 6 });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            console.error('Error executing purge command:', error);
            const errorMessage = {
                content: locale.commands.purge.commandError,
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