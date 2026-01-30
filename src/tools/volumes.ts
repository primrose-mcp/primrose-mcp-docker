/**
 * Volume Tools
 *
 * MCP tools for Docker volume management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all volume-related tools
 */
export function registerVolumeTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // List Volumes
  // ===========================================================================
  server.tool(
    'docker_list_volumes',
    `List Docker volumes.

Args:
  - dangling: Filter by dangling status
  - driver: Filter by driver
  - format: Response format ('json' or 'markdown')

Returns:
  List of volumes with name, driver, scope, and mountpoint.`,
    {
      dangling: z.boolean().optional().describe('Filter by dangling status'),
      driver: z.string().optional().describe('Filter by driver'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ dangling, driver, format }) => {
      try {
        const filters: Record<string, unknown[]> = {};
        if (dangling !== undefined) filters.dangling = [dangling];
        if (driver) filters.driver = [driver];
        const result = await client.listVolumes(Object.keys(filters).length > 0 ? filters : undefined);
        return formatResponse(
          { items: result.volumes, count: result.volumes.length, hasMore: false },
          format,
          'volumes'
        );
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Volume
  // ===========================================================================
  server.tool(
    'docker_inspect_volume',
    `Get detailed information about a volume.

Args:
  - name: Volume name
  - format: Response format ('json' or 'markdown')

Returns:
  Detailed volume configuration.`,
    {
      name: z.string().describe('Volume name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ name, format }) => {
      try {
        const volume = await client.inspectVolume(name);
        return formatResponse(volume, format, 'volume');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Volume
  // ===========================================================================
  server.tool(
    'docker_create_volume',
    `Create a new volume.

Args:
  - name: Volume name (optional, will be generated if not provided)
  - driver: Volume driver (default: "local")
  - driverOpts: Driver-specific options
  - labels: Volume labels

Returns:
  Created volume details.`,
    {
      name: z.string().optional().describe('Volume name'),
      driver: z.string().default('local').describe('Volume driver'),
      driverOpts: z.record(z.string(), z.string()).optional().describe('Driver-specific options'),
      labels: z.record(z.string(), z.string()).optional().describe('Volume labels'),
    },
    async ({ name, driver, driverOpts, labels }) => {
      try {
        const volume = await client.createVolume({ name, driver, driverOpts, labels });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Volume ${volume.name} created`,
                volume,
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
  // Remove Volume
  // ===========================================================================
  server.tool(
    'docker_remove_volume',
    `Remove a volume.

Args:
  - name: Volume name
  - force: Force removal even if in use

Returns:
  Confirmation of removal.`,
    {
      name: z.string().describe('Volume name'),
      force: z.boolean().default(false).describe('Force removal'),
    },
    async ({ name, force }) => {
      try {
        await client.removeVolume(name, force);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Volume ${name} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Prune Volumes
  // ===========================================================================
  server.tool(
    'docker_prune_volumes',
    `Remove all unused volumes.

Returns:
  List of deleted volume names and space reclaimed.`,
    {},
    async () => {
      try {
        const result = await client.pruneVolumes();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                volumesDeleted: result.volumesDeleted,
                spaceReclaimed: result.spaceReclaimed,
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
