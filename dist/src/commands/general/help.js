"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = exports.data = void 0;
const discord_js_1 = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const settings_json_1 = __importDefault(require('../../../settings.json'));
const fs_1 = require("fs");
const path_1 = require("path");

// Helper function to get category emoji
function getCategoryEmoji(category) {
    const emojis = {
        admin: '👑',
        moderation: '🛡️',
        general: '📌',
        utility: '🔧',
        fun: '🎮',
        music: '🎵',
        economy: '💰',
        leveling: '⭐',
        settings: '⚙️',
        other: '📁'
    };
    return emojis[category.toLowerCase()] || '📁';
}

exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands')
    .addStringOption(option => option
        .setName('category')
        .setDescription('Specific category of commands to show')
        .setRequired(false)
        .addChoices(
            { name: 'Admin', value: 'admin' },
            { name: 'General', value: 'general' },
            { name: 'Utility', value: 'utility' },
            { name: 'All', value: 'all' }
        ));

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.help) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.help) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.help) {
        locale = {
            commands: {
                help: {
                    title: "Command List",
                    description: "Here are all the available commands:",
                    category: {
                        admin: "👑 Admin Commands",
                        general: "📌 General Commands",
                        utility: "🔧 Utility Commands",
                        all: "📚 All Commands"
                    },
                    commandInfo: "{name} - {description}",
                    noCommands: "No commands found in this category.",
                    requestedBy: "Requested by {user}",
                    commandError: "An error occurred while executing the command.",
                    categoryNotFound: "Category not found.",
                    tooManyCommands: "Too many commands in this category. Please select a specific category from the dropdown."
                }
            }
        };
    }
    return locale;
};

// Helper function to split commands into multiple fields if needed
function splitCommandsIntoFields(commands, locale, maxFieldLength = 1024) {
    const fields = [];
    let currentField = '';
    let currentLength = 0;

    for (const cmd of commands) {
        const commandText = locale.commands.help.commandInfo
            .replace('{name}', cmd.name)
            .replace('{description}', cmd.description) + '\n';

        // If adding this command would exceed the limit, start a new field
        if (currentLength + commandText.length > maxFieldLength && currentField !== '') {
            fields.push(currentField);
            currentField = commandText;
            currentLength = commandText.length;
        } else {
            currentField += commandText;
            currentLength += commandText.length;
        }
    }

    // Add the last field if it has content
    if (currentField !== '') {
        fields.push(currentField);
    }

    return fields;
}

exports.command = {
    name: 'help',
    aliases: settings_json_1.default.commands?.help?.aliases || ['h', 'commands'],
    enabled: settings_json_1.default.commands?.help?.enabled ?? true,
    execute: async (interaction, args, client) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const commandFolders = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '../'))
                .filter(folder => (0, fs_1.statSync)((0, path_1.join)(__dirname, '../', folder)).isDirectory());

            const commands = new Map();
            const categories = new Set();

            // Load all commands and categories
            for (const folder of commandFolders) {
                const commandFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '../', folder))
                    .filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    const command = require((0, path_1.join)(__dirname, '../', folder, file));
                    if (command.command?.enabled !== false && command.data) {
                        const prefix = settings_json_1.default.prefix || '!';
                        commands.set(command.data.name, {
                            ...command.data.toJSON(),
                            category: folder,
                            displayName: `${prefix}${command.data.name}, /${command.data.name}`
                        });
                        categories.add(folder);
                    }
                }
            }

            // Create the base embed
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(locale.commands.help.title)
                .setDescription(locale.commands.help.description)
                .setColor(0x2f3136)
                .setTimestamp()
                .setFooter({
                    text: locale.commands.help.requestedBy.replace(
                        '{user}',
                        isSlash ? interaction.user.tag : interaction.author.tag
                    )
                });

            // Create category dropdown menu
            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('help-category')
                        .setPlaceholder('Select a category')
                        .addOptions([
                            {
                                label: 'All Commands',
                                value: 'all',
                                emoji: '📚',
                                description: 'View all available commands'
                            },
                            ...Array.from(categories).map(category => ({
                                label: category.charAt(0).toUpperCase() + category.slice(1),
                                value: category,
                                emoji: getCategoryEmoji(category),
                                description: `View ${category} commands`
                            }))
                        ])
                );

            // Function to update embed with commands
            const updateEmbed = (categoryFilter = 'all') => {
                const filteredCommands = Array.from(commands.values())
                    .filter(cmd => categoryFilter === 'all' || cmd.category === categoryFilter);

                if (filteredCommands.length === 0) {
                    return new discord_js_1.EmbedBuilder()
                        .setTitle(locale.commands.help.title)
                        .setDescription(locale.commands.help.noCommands)
                        .setColor(0x2f3136)
                        .setTimestamp()
                        .setFooter({
                            text: locale.commands.help.requestedBy.replace(
                                '{user}',
                                isSlash ? interaction.user.tag : interaction.author.tag
                            )
                        });
                }

                const newEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle(locale.commands.help.title)
                    .setDescription(locale.commands.help.description)
                    .setColor(0x2f3136)
                    .setTimestamp()
                    .setFooter({
                        text: locale.commands.help.requestedBy.replace(
                            '{user}',
                            isSlash ? interaction.user.tag : interaction.author.tag
                        )
                    });

                // Group commands by category
                const categoryGroups = new Map();
                for (const command of filteredCommands) {
                    if (!categoryGroups.has(command.category)) {
                        categoryGroups.set(command.category, []);
                    }
                    categoryGroups.get(command.category).push(command);
                }

                // Add fields for each category
                for (const [category, categoryCommands] of categoryGroups) {
                    // Format commands for this category
                    const formattedCommands = categoryCommands
                        .map(cmd => locale.commands.help.commandInfo
                            .replace('{name}', cmd.displayName)
                            .replace('{description}', cmd.description))
                        .join('\n');

                    // Check if the field content is too long
                    if (formattedCommands.length > 1024) {
                        // Split into multiple fields
                        const commandFields = splitCommandsIntoFields(categoryCommands, locale);
                        
                        for (let i = 0; i < commandFields.length; i++) {
                            const fieldName = i === 0 
                                ? `${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`
                                : `${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)} (cont.)`;
                            
                            newEmbed.addFields({
                                name: fieldName,
                                value: commandFields[i],
                                inline: false
                            });
                        }
                    } else {
                        // Add as single field
                        newEmbed.addFields({
                            name: `${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                            value: formattedCommands,
                            inline: false
                        });
                    }
                }

                return newEmbed;
            };

            // Initial reply
            const message = await (isSlash ? 
                interaction.reply({ embeds: [updateEmbed('all')], components: [row], fetchReply: true }) :
                interaction.reply({ embeds: [updateEmbed('all')], components: [row], fetchReply: true }));

            // Create collector for dropdown menu
            const collector = message.createMessageComponentCollector({ 
                componentType: ComponentType.StringSelect, 
                time: 300000 // 5 minutes
            });

            collector.on('collect', async i => {
                if (i.customId === 'help-category') {
                    const category = i.values[0];
                    await i.update({ embeds: [updateEmbed(category)], components: [row] });
                }
            });

            collector.on('end', () => {
                // Remove dropdown menu after timeout
                if (message.editable) {
                    const finalEmbed = message.embeds[0];
                    message.edit({ embeds: [finalEmbed], components: [] }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error executing help command:', error);
            const errorMessage = {
                content: locale.commands.help.commandError,
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