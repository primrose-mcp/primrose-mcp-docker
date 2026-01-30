/**
 * Plugin Tools
 *
 * MCP tools for Docker plugin management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all plugin-related tools
 */
export function registerPluginTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // List Plugins
  // ===========================================================================
  server.tool(
    'docker_list_plugins',
    `List installed Docker plugins.

Args:
  - enabled: Filter by enabled status
  - format: Response format ('json' or 'markdown')

Returns:
  List of plugins with name, enabled status, and description.`,
    {
      enabled: z.boolean().optional().describe('Filter by enabled status'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ enabled, format }) => {
      try {
        const filters = enabled !== undefined ? { enable: [enabled] } : undefined;
        const plugins = await client.listPlugins(filters);
        return formatResponse({ items: plugins, count: plugins.length, hasMore: false }, format, 'plugins');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Plugin
  // ===========================================================================
  server.tool(
    'docker_inspect_plugin',
    `Get detailed information about a plugin.

Args:
  - name: Plugin name

Returns:
  Detailed plugin configuration.`,
    {
      name: z.string().describe('Plugin name'),
    },
    async ({ name }) => {
      try {
        const plugin = await client.inspectPlugin(name);
        return {
          content: [{ type: 'text', text: JSON.stringify(plugin, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Plugin Privileges
  // ===========================================================================
  server.tool(
    'docker_plugin_privileges',
    `Get privileges required by a plugin.

Args:
  - remote: Plugin image reference

Returns:
  List of privileges required by the plugin.`,
    {
      remote: z.string().describe('Plugin image reference'),
    },
    async ({ remote }) => {
      try {
        const privileges = await client.getPluginPrivileges(remote);
        return {
          content: [{ type: 'text', text: JSON.stringify(privileges, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Install Plugin
  // ===========================================================================
  server.tool(
    'docker_install_plugin',
    `Install a plugin from a registry.

Args:
  - remote: Plugin image reference (e.g., "vieux/sshfs:latest")
  - name: Local name for the plugin
  - grantAllPermissions: Grant all required permissions automatically

Returns:
  Confirmation of installation.`,
    {
      remote: z.string().describe('Plugin image reference'),
      name: z.string().optional().describe('Local name for the plugin'),
      grantAllPermissions: z.boolean().default(false).describe('Grant all permissions'),
    },
    async ({ remote, name, grantAllPermissions }) => {
      try {
        let privileges;
        if (grantAllPermissions) {
          privileges = await client.getPluginPrivileges(remote);
        }
        await client.installPlugin(remote, name, privileges);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Plugin ${remote} installed${name ? ` as ${name}` : ''}`,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Enable Plugin
  // ===========================================================================
  server.tool(
    'docker_enable_plugin',
    `Enable a plugin.

Args:
  - name: Plugin name
  - timeout: Timeout in seconds

Returns:
  Confirmation of enable.`,
    {
      name: z.string().describe('Plugin name'),
      timeout: z.number().int().min(0).default(0).describe('Timeout in seconds'),
    },
    async ({ name, timeout }) => {
      try {
        await client.enablePlugin(name, timeout);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Plugin ${name} enabled` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Disable Plugin
  // ===========================================================================
  server.tool(
    'docker_disable_plugin',
    `Disable a plugin.

Args:
  - name: Plugin name
  - force: Force disable

Returns:
  Confirmation of disable.`,
    {
      name: z.string().describe('Plugin name'),
      force: z.boolean().default(false).describe('Force disable'),
    },
    async ({ name, force }) => {
      try {
        await client.disablePlugin(name, force);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Plugin ${name} disabled` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Remove Plugin
  // ===========================================================================
  server.tool(
    'docker_remove_plugin',
    `Remove a plugin.

Args:
  - name: Plugin name
  - force: Force removal

Returns:
  Confirmation of removal.`,
    {
      name: z.string().describe('Plugin name'),
      force: z.boolean().default(false).describe('Force removal'),
    },
    async ({ name, force }) => {
      try {
        await client.removePlugin(name, force);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Plugin ${name} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Upgrade Plugin
  // ===========================================================================
  server.tool(
    'docker_upgrade_plugin',
    `Upgrade a plugin.

Args:
  - name: Plugin name
  - remote: New plugin image reference
  - grantAllPermissions: Grant all required permissions automatically

Returns:
  Confirmation of upgrade.`,
    {
      name: z.string().describe('Plugin name'),
      remote: z.string().describe('New plugin image reference'),
      grantAllPermissions: z.boolean().default(false).describe('Grant all permissions'),
    },
    async ({ name, remote, grantAllPermissions }) => {
      try {
        let privileges;
        if (grantAllPermissions) {
          privileges = await client.getPluginPrivileges(remote);
        }
        await client.upgradePlugin(name, remote, privileges);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Plugin ${name} upgraded to ${remote}`,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Configure Plugin
  // ===========================================================================
  server.tool(
    'docker_configure_plugin',
    `Configure a plugin.

Args:
  - name: Plugin name
  - settings: Plugin settings (array of KEY=VALUE)

Returns:
  Confirmation of configuration.`,
    {
      name: z.string().describe('Plugin name'),
      settings: z.array(z.string()).describe('Plugin settings (KEY=VALUE)'),
    },
    async ({ name, settings }) => {
      try {
        await client.configurePlugin(name, settings);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Plugin ${name} configured`,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
