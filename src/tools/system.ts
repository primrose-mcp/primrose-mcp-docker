/**
 * System Tools
 *
 * MCP tools for Docker system operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all system-related tools
 */
export function registerSystemTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // Get System Info
  // ===========================================================================
  server.tool(
    'docker_system_info',
    `Get Docker system-wide information.

Args:
  - format: Response format ('json' or 'markdown')

Returns:
  System information including containers, images, kernel, OS, CPU, memory.`,
    {
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ format }) => {
      try {
        const info = await client.getSystemInfo();
        return formatResponse(info, format, 'system_info');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Version
  // ===========================================================================
  server.tool(
    'docker_version',
    `Get Docker version information.

Returns:
  Docker version, API version, Go version, OS, architecture.`,
    {},
    async () => {
      try {
        const version = await client.getVersion();
        return {
          content: [{ type: 'text', text: JSON.stringify(version, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Ping
  // ===========================================================================
  server.tool(
    'docker_ping',
    `Ping the Docker daemon.

Returns:
  "OK" if the daemon is responsive.`,
    {},
    async () => {
      try {
        const result = await client.ping();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Docker daemon is responsive',
                response: result,
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
  // Get Data Usage
  // ===========================================================================
  server.tool(
    'docker_disk_usage',
    `Get Docker disk usage information.

Args:
  - format: Response format ('json' or 'markdown')

Returns:
  Disk usage for images, containers, volumes, and build cache.`,
    {
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ format }) => {
      try {
        const usage = await client.getDataUsage();
        return formatResponse(usage, format, 'disk_usage');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Events
  // ===========================================================================
  server.tool(
    'docker_events',
    `Get Docker events.

Args:
  - since: Unix timestamp to start from
  - until: Unix timestamp to end at
  - type: Filter by event type (container, image, volume, network, daemon, plugin, node, service, secret, config)
  - format: Response format ('json' or 'markdown')

Returns:
  List of Docker events.`,
    {
      since: z.number().int().optional().describe('Unix timestamp to start from'),
      until: z.number().int().optional().describe('Unix timestamp to end at'),
      type: z.enum(['container', 'image', 'volume', 'network', 'daemon', 'plugin', 'node', 'service', 'secret', 'config']).optional().describe('Filter by event type'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ since, until, type, format }) => {
      try {
        const filters = type ? { type: [type] } : undefined;
        const events = await client.getEvents(since, until, filters);
        return formatResponse({ items: events, count: events.length, hasMore: false }, format, 'events');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Authenticate
  // ===========================================================================
  server.tool(
    'docker_auth',
    `Authenticate with a registry.

Args:
  - username: Registry username
  - password: Registry password
  - serveraddress: Registry address (default: Docker Hub)

Returns:
  Authentication status.`,
    {
      username: z.string().describe('Registry username'),
      password: z.string().describe('Registry password'),
      serveraddress: z.string().optional().describe('Registry address'),
    },
    async ({ username, password, serveraddress }) => {
      try {
        const result = await client.auth({ username, password, serveraddress });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                status: result.status,
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
