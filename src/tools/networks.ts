/**
 * Network Tools
 *
 * MCP tools for Docker network management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all network-related tools
 */
export function registerNetworkTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // List Networks
  // ===========================================================================
  server.tool(
    'docker_list_networks',
    `List Docker networks.

Args:
  - driver: Filter by driver (e.g., "bridge", "overlay")
  - scope: Filter by scope ("swarm", "global", "local")
  - format: Response format ('json' or 'markdown')

Returns:
  List of networks with ID, name, driver, and scope.`,
    {
      driver: z.string().optional().describe('Filter by driver'),
      scope: z.enum(['swarm', 'global', 'local']).optional().describe('Filter by scope'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ driver, scope, format }) => {
      try {
        const filters: Record<string, string[]> = {};
        if (driver) filters.driver = [driver];
        if (scope) filters.scope = [scope];
        const networks = await client.listNetworks(Object.keys(filters).length > 0 ? filters : undefined);
        return formatResponse({ items: networks, count: networks.length, hasMore: false }, format, 'networks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Network
  // ===========================================================================
  server.tool(
    'docker_inspect_network',
    `Get detailed information about a network.

Args:
  - id: Network ID or name
  - format: Response format ('json' or 'markdown')

Returns:
  Detailed network configuration including connected containers.`,
    {
      id: z.string().describe('Network ID or name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ id, format }) => {
      try {
        const network = await client.inspectNetwork(id);
        return formatResponse(network, format, 'network');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Network
  // ===========================================================================
  server.tool(
    'docker_create_network',
    `Create a new network.

Args:
  - name: Network name (required)
  - driver: Network driver (default: "bridge")
  - internal: Restrict external access
  - attachable: Enable manual container attachment
  - enableIPv6: Enable IPv6
  - subnet: Subnet in CIDR format (e.g., "172.28.0.0/16")
  - gateway: Gateway address
  - ipRange: IP range to allocate from
  - labels: Network labels

Returns:
  Created network ID.`,
    {
      name: z.string().describe('Network name'),
      driver: z.string().default('bridge').describe('Network driver'),
      internal: z.boolean().optional().describe('Restrict external access'),
      attachable: z.boolean().optional().describe('Enable manual container attachment'),
      enableIPv6: z.boolean().optional().describe('Enable IPv6'),
      subnet: z.string().optional().describe('Subnet in CIDR format'),
      gateway: z.string().optional().describe('Gateway address'),
      ipRange: z.string().optional().describe('IP range to allocate from'),
      labels: z.record(z.string(), z.string()).optional().describe('Network labels'),
    },
    async ({ name, driver, internal, attachable, enableIPv6, subnet, gateway, ipRange, labels }) => {
      try {
        const ipam = subnet || gateway || ipRange
          ? {
              driver: 'default',
              config: [{
                subnet,
                gateway,
                ipRange,
              }],
            }
          : undefined;

        const result = await client.createNetwork({
          name,
          driver,
          internal,
          attachable,
          enableIPv6,
          ipam,
          labels,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Network ${name} created`,
                networkId: result.id,
                warning: result.warning || undefined,
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
  // Remove Network
  // ===========================================================================
  server.tool(
    'docker_remove_network',
    `Remove a network.

Args:
  - id: Network ID or name

Returns:
  Confirmation of removal.`,
    {
      id: z.string().describe('Network ID or name'),
    },
    async ({ id }) => {
      try {
        await client.removeNetwork(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Network ${id} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Connect Container to Network
  // ===========================================================================
  server.tool(
    'docker_connect_network',
    `Connect a container to a network.

Args:
  - networkId: Network ID or name
  - containerId: Container ID or name
  - ipv4Address: IPv4 address to assign
  - ipv6Address: IPv6 address to assign
  - aliases: Network aliases for the container

Returns:
  Confirmation of connection.`,
    {
      networkId: z.string().describe('Network ID or name'),
      containerId: z.string().describe('Container ID or name'),
      ipv4Address: z.string().optional().describe('IPv4 address to assign'),
      ipv6Address: z.string().optional().describe('IPv6 address to assign'),
      aliases: z.array(z.string()).optional().describe('Network aliases'),
    },
    async ({ networkId, containerId, ipv4Address, ipv6Address, aliases }) => {
      try {
        await client.connectNetwork(networkId, {
          container: containerId,
          endpointConfig: ipv4Address || ipv6Address || aliases
            ? {
                ipamConfig: ipv4Address || ipv6Address
                  ? { ipv4Address, ipv6Address }
                  : undefined,
                aliases,
                networkId: '',
                endpointId: '',
                gateway: '',
                ipAddress: '',
                ipPrefixLen: 0,
                macAddress: '',
              }
            : undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Container ${containerId} connected to network ${networkId}`,
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
  // Disconnect Container from Network
  // ===========================================================================
  server.tool(
    'docker_disconnect_network',
    `Disconnect a container from a network.

Args:
  - networkId: Network ID or name
  - containerId: Container ID or name
  - force: Force disconnection

Returns:
  Confirmation of disconnection.`,
    {
      networkId: z.string().describe('Network ID or name'),
      containerId: z.string().describe('Container ID or name'),
      force: z.boolean().default(false).describe('Force disconnection'),
    },
    async ({ networkId, containerId, force }) => {
      try {
        await client.disconnectNetwork(networkId, { container: containerId, force });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Container ${containerId} disconnected from network ${networkId}`,
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
  // Prune Networks
  // ===========================================================================
  server.tool(
    'docker_prune_networks',
    `Remove all unused networks.

Returns:
  List of deleted network IDs.`,
    {},
    async () => {
      try {
        const result = await client.pruneNetworks();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                networksDeleted: result.networksDeleted,
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
