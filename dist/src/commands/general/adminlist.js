"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = exports.data = void 0;

const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const settings = __importDefault(require('../../../settings.json'));
const { checkCommandPermissions } = require("../../utils/permissionChecker");

exports.data = new SlashCommandBuilder()
    .setName('adminlist')
    .setDescription('Shows a list of all admins in the server');

const checkPermissions = (member) => {
    return checkCommandPermissions(member, settings.default.commands?.adminlist);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);

    if (!locale?.commands?.adminlist) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.adminlist) {
        locale = client.locales.get('en');
    }

    // fallback
    if (!locale?.commands?.adminlist) {
        locale = {
            commands: {
                adminlist: {
                    title: "Admin List",
                    description: "Admins in this server",
                    noPermission: "You do not have permission to use this command.",
                    noneFound: "No admins found in this server.",
                    commandError: "An error occurred while executing the command.",
                    requestedBy: "Requested by {user}"
                }
            }
        };
    }
    return locale;
};

exports.command = {
    name: 'adminlist',
    aliases: settings.default.commands?.adminlist?.aliases || [],
    enabled: settings.default.commands?.adminlist?.enabled ?? true,

    execute: async (interaction, _args, client) => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = interaction.member;

            if (!checkPermissions(executingMember)) {
                const reply = { content: locale.commands.adminlist.noPermission, flags: 1 << 6 };
                return isSlash ? interaction.reply(reply) : interaction.reply(reply.content);
            }

            const members = await guild.members.fetch();
            const admins = members.filter(m => m.permissions.has(PermissionFlagsBits.Administrator));

            if (!admins.size) {
                const reply = { content: locale.commands.adminlist.noneFound, flags: 1 << 6 };
                return isSlash ? interaction.reply(reply) : interaction.reply(reply.content);
            }

            const adminList = admins.map(m => `• ${m.user.tag} (${m.id})`).join("\n");

            const embed = new EmbedBuilder()
                .setTitle(locale.commands.adminlist.title)
                .setDescription(adminList)
                .setColor('#ff9900')
                .setFooter({
                    text: locale.commands.adminlist.requestedBy.replace(
                        '{user}',
                        isSlash ? interaction.user.tag : interaction.author.tag
                    )
                })
                .setTimestamp();

            return isSlash
                ? interaction.reply({ embeds: [embed] })
                : interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error("Error executing adminlist command:", err);

            const errorReply = {
                content: locale.commands.adminlist.commandError,
                flags: 1 << 6
            };

            if (interaction instanceof ChatInputCommandInteraction) {
                if (!interaction.replied) await interaction.reply(errorReply);
                else await interaction.followUp(errorReply);
            } else {
                await interaction.reply(errorReply.content);
            }
        }
    }
};
