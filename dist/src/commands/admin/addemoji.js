"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = exports.data = void 0;
const discord_js_1 = require("discord.js");
const settings_json_1 = __importDefault(require('../../../settings.json'));
const permissionChecker_1 = require("../../utils/permissionChecker");
const axios_1 = __importDefault(require("axios"));

exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('addemoji')
    .setDescription('Add an emoji to the server')
    .addStringOption(option => option
        .setName('emoji')
        .setDescription('Emoji or URL to add')
        .setRequired(true))
    .addStringOption(option => option
        .setName('name')
        .setDescription('Name for the emoji (default: stolen_emoji)')
        .setRequired(false));

const checkPermissions = (member) => {
    return (0, permissionChecker_1.checkCommandPermissions)(member, settings_json_1.default.commands?.addemoji);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.addemoji) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.addemoji) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.addemoji) {
        locale = {
            commands: {
                addemoji: {
                    title: "Add Emoji",
                    description: "Add an emoji to the server",
                    noPermission: "You do not have permission to use this command.",
                    missingManageEmojis: "You must have `Manage Emojis` permission to use this command.",
                    botMissingPermissions: "I must have `Manage Emojis` permission to use this command.",
                    noEmojiProvided: "Please provide an emoji or URL to add.",
                    success: "Successfully added the emoji {emoji}.",
                    error: "I was unable to add the emoji.\nPossible Reasons: `Mass emojis added`, `Slots are Full`.",
                    commandError: "An error occurred while executing the command.",
                    requestedBy: "Requested by {user}"
                }
            }
        };
    }
    return locale;
};

const extractEmojiUrl = async (emojiInput) => {
    // If it's a custom Discord emoji (<:name:id> or <a:name:id>)
    if (emojiInput.startsWith("<") && emojiInput.endsWith(">")) {
        const id = emojiInput.match(/\d{15,}/g)?.[0];
        if (!id) return null;

        // Check if it's a GIF (animated emoji)
        try {
            const response = await axios_1.default.get(`https://cdn.discordapp.com/emojis/${id}.gif`);
            if (response.status === 200) {
                return `https://cdn.discordapp.com/emojis/${id}.gif?quality=lossless`;
            }
        } catch {
            // If GIF fails, it's a PNG
            return `https://cdn.discordapp.com/emojis/${id}.png?quality=lossless`;
        }
    }
    
    // If it's already a URL, return as is
    if (emojiInput.startsWith('http')) {
        return emojiInput;
    }
    
    return null;
};

exports.command = {
    name: 'addemoji',
    aliases: settings_json_1.default.commands?.addemoji?.aliases || ['steal'],
    enabled: settings_json_1.default.commands?.addemoji?.enabled ?? true,
    execute: async (interaction, _args, client, prefix) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = isSlash ? interaction.member : interaction.member;
            
            // Check command permissions
            if (!checkPermissions(executingMember)) {
                const noPermissionMessage = {
                    content: locale.commands.addemoji.noPermission,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noPermissionMessage);
                } else {
                    await interaction.reply(noPermissionMessage.content);
                }
                return;
            }

            // Check user has Manage Emojis permission
            if (!executingMember.permissions.has('ManageEmojisAndStickers')) {
                const noManageEmojis = {
                    content: locale.commands.addemoji.missingManageEmojis,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noManageEmojis);
                } else {
                    await interaction.reply(noManageEmojis.content);
                }
                return;
            }

            // Check bot permissions
            const botMember = guild?.members.me;
            if (!botMember?.permissions.has('ManageEmojisAndStickers')) {
                const botMissingPerms = {
                    content: locale.commands.addemoji.botMissingPermissions,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(botMissingPerms);
                } else {
                    await interaction.reply(botMissingPerms.content);
                }
                return;
            }

            let emojiInput;
            let name;

            if (isSlash) {
                emojiInput = interaction.options.getString('emoji', true);
                name = interaction.options.getString('name') || 'stolen_emoji';
            } else {
                emojiInput = _args[0];
                name = _args[1] || 'stolen_emoji';
            }

            // Validate emoji input
            if (!emojiInput) {
                const noEmojiMessage = {
                    content: locale.commands.addemoji.noEmojiProvided,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(noEmojiMessage);
                } else {
                    await interaction.reply(noEmojiMessage.content);
                }
                return;
            }

            // Extract emoji URL
            const emojiUrl = await extractEmojiUrl(emojiInput);
            
            if (!emojiUrl) {
                const invalidEmojiMessage = {
                    content: "Please provide a valid emoji or image URL.",
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(invalidEmojiMessage);
                } else {
                    await interaction.reply(invalidEmojiMessage.content);
                }
                return;
            }

            // Create the emoji
            try {
                const newEmoji = await guild.emojis.create({ 
                    attachment: emojiUrl, 
                    name: name 
                });

                const successEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(client.color || '#0099ff')
                    .setDescription(locale.commands.addemoji.success.replace('{emoji}', newEmoji.toString()))
                    .setFooter({
                        text: locale.commands.addemoji.requestedBy.replace('{user}', 
                            isSlash ? interaction.user.tag : interaction.author.tag)
                    })
                    .setTimestamp();

                if (isSlash) {
                    await interaction.reply({ embeds: [successEmbed] });
                } else {
                    await interaction.reply({ embeds: [successEmbed] });
                }

            } catch (error) {
                console.error('Error creating emoji:', error);
                const errorEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(client.color || '#ff0000')
                    .setDescription(locale.commands.addemoji.error)
                    .setFooter({
                        text: locale.commands.addemoji.requestedBy.replace('{user}', 
                            isSlash ? interaction.user.tag : interaction.author.tag)
                    })
                    .setTimestamp();

                if (isSlash) {
                    await interaction.reply({ embeds: [errorEmbed], flags: 1 << 6 });
                } else {
                    await interaction.reply({ embeds: [errorEmbed] });
                }
            }

        } catch (error) {
            console.error('Error executing addemoji command:', error);
            const errorMessage = {
                content: locale.commands.addemoji.commandError,
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