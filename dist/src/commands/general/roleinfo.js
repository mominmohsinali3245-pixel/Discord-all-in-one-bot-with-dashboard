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
    .setName('roleinfo')
    .setDescription('Get detailed information about a role')
    .addRoleOption(option => option
        .setName('role')
        .setDescription('The role to get information about')
        .setRequired(true));

const checkPermissions = (member) => {
    return (0, permissionChecker_1.checkCommandPermissions)(member, settings_json_1.default.commands?.roleinfo);
};

const getLocale = (client, preferredLocale) => {
    let locale = client.locales.get(preferredLocale || client.defaultLanguage);
    if (!locale?.commands?.roleinfo) {
        locale = client.locales.get(client.defaultLanguage);
    }
    if (!locale?.commands?.roleinfo) {
        locale = client.locales.get('en');
    }
    if (!locale?.commands?.roleinfo) {
        locale = {
            commands: {
                roleinfo: {
                    title: "{roleName}'s Information",
                    author: "CodeX RoleInfo Panel",
                    noPermission: "You do not have permission to use this command.",
                    invalidRole: "You didn't provide a valid role.",
                    commandError: "An error occurred while executing the command.",
                    requestedBy: "Requested by {user}",
                    generalInfo: "**__General Info__**",
                    roleName: "Role Name",
                    roleId: "Role Id",
                    rolePosition: "Role Position",
                    color: "Color",
                    createdAt: "Created At",
                    mentionability: "Mentionability",
                    integration: "Integration",
                    members: "**__Members__**",
                    membersSize: "Role Members Size",
                    roleMembers: "Role Members",
                    keyPermissions: "**__Key Permissions__**",
                    yes: "Yes",
                    no: "No"
                }
            }
        };
    }
    return locale;
};

exports.command = {
    name: 'roleinfo',
    aliases: settings_json_1.default.commands?.roleinfo?.aliases || ['ri', 'rinfo'],
    enabled: settings_json_1.default.commands?.roleinfo?.enabled ?? true,
    execute: async (interaction, _args, client, prefix) => {
        const isSlash = interaction instanceof discord_js_1.ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : interaction.guild;
        const locale = getLocale(client, guild?.preferredLocale ?? null);

        try {
            const executingMember = isSlash ? interaction.member : interaction.member;
            
            // Check command permissions
            if (!checkPermissions(executingMember)) {
                const noPermissionMessage = {
                    content: locale.commands.roleinfo.noPermission,
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

            let role;
            if (isSlash) {
                role = interaction.options.getRole('role');
            } else {
                const message = interaction;
                role = message.mentions.roles.first() || guild.roles.cache.get(_args[0]);
            }

            // Validate role
            if (!role) {
                const invalidRoleMessage = {
                    content: locale.commands.roleinfo.invalidRole,
                    flags: 1 << 6
                };
                if (isSlash) {
                    await interaction.reply(invalidRoleMessage);
                } else {
                    await interaction.reply(invalidRoleMessage.content);
                }
                return;
            }

            // Get role information
            const color = role.hexColor;
            const created = `<t:${Math.round(role.createdTimestamp / 1000)}:R>`;
            
            // Format role members
            let rolemembers;
            if (role.members.size > 20) {
                rolemembers = role.members.map(e => `<@${e.id}>`).slice(0, 20).join(", ") + 
                    ` and ${role.members.size - 20} more members...`;
            } else {
                rolemembers = role.members.map(e => `<@${e.id}>`).join(", ") || "No members";
            }

            // Format permissions
            const permissions = role.permissions.toArray().includes("Administrator") ? 
                "`ADMINISTRATOR`" : 
                role.permissions.toArray()
                    .sort((a, b) => a.localeCompare(b))
                    .map(p => `\`${p}\``)
                    .join(", ") || "No special permissions";

            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(locale.commands.roleinfo.title.replace('{roleName}', role.name))
                .setAuthor({
                    name: locale.commands.roleinfo.author,
                    iconURL: client.user.displayAvatarURL()
                })
                .addFields([
                    { 
                        name: locale.commands.roleinfo.generalInfo, 
                        value: `**${locale.commands.roleinfo.roleName}:** ${role.name}\n**${locale.commands.roleinfo.roleId}:** \`${role.id}\`\n**${locale.commands.roleinfo.rolePosition}:** ${role.rawPosition}\n**${locale.commands.roleinfo.color}:** ${color}\n**${locale.commands.roleinfo.createdAt}:** ${created}\n**${locale.commands.roleinfo.mentionability}:** ${role.mentionable ? locale.commands.roleinfo.yes : locale.commands.roleinfo.no}\n**${locale.commands.roleinfo.integration}:** ${role.managed ? locale.commands.roleinfo.yes : locale.commands.roleinfo.no}`
                    }
                ])
                .addFields([
                    { 
                        name: locale.commands.roleinfo.members, 
                        value: `**${locale.commands.roleinfo.membersSize}:** ${role.members.size || 0}\n**${locale.commands.roleinfo.roleMembers}:** ${rolemembers}`,
                        inline: false 
                    }
                ])
                .addFields([
                    { 
                        name: locale.commands.roleinfo.keyPermissions, 
                        value: permissions, 
                        inline: true 
                    }
                ])
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: locale.commands.roleinfo.requestedBy.replace('{user}', 
                        isSlash ? interaction.user.tag : interaction.author.tag), 
                    iconURL: isSlash ? interaction.user.displayAvatarURL() : interaction.author.displayAvatarURL()
                })
                .setColor(role.color || client.color || "#2f3136");

            if (isSlash) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error executing roleinfo command:', error);
            const errorMessage = {
                content: locale.commands.roleinfo.commandError,
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