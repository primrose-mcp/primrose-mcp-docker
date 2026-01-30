/**
 * Swarm Tools
 *
 * MCP tools for Docker Swarm management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all swarm-related tools
 */
export function registerSwarmTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // Inspect Swarm
  // ===========================================================================
  server.tool(
    'docker_swarm_inspect',
    `Get information about the swarm.

Returns:
  Swarm configuration and status.`,
    {},
    async () => {
      try {
        const swarm = await client.inspectSwarm();
        return {
          content: [{ type: 'text', text: JSON.stringify(swarm, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Initialize Swarm
  // ===========================================================================
  server.tool(
    'docker_swarm_init',
    `Initialize a new swarm.

Args:
  - listenAddr: Listen address (default: "0.0.0.0:2377")
  - advertiseAddr: Advertise address
  - dataPathAddr: Data path address
  - forceNewCluster: Force create a new cluster

Returns:
  Node ID of the swarm manager.`,
    {
      listenAddr: z.string().default('0.0.0.0:2377').describe('Listen address'),
      advertiseAddr: z.string().optional().describe('Advertise address'),
      dataPathAddr: z.string().optional().describe('Data path address'),
      forceNewCluster: z.boolean().default(false).describe('Force create a new cluster'),
    },
    async ({ listenAddr, advertiseAddr, dataPathAddr, forceNewCluster }) => {
      try {
        const nodeId = await client.initSwarm({
          listenAddr,
          advertiseAddr,
          dataPathAddr,
          forceNewCluster,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Swarm initialized',
                nodeId,
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
  // Join Swarm
  // ===========================================================================
  server.tool(
    'docker_swarm_join',
    `Join an existing swarm.

Args:
  - joinToken: Token to join the swarm (worker or manager)
  - remoteAddrs: Addresses of existing managers
  - listenAddr: Listen address (default: "0.0.0.0:2377")
  - advertiseAddr: Advertise address
  - dataPathAddr: Data path address

Returns:
  Confirmation of join.`,
    {
      joinToken: z.string().describe('Token to join the swarm'),
      remoteAddrs: z.array(z.string()).describe('Addresses of existing managers'),
      listenAddr: z.string().default('0.0.0.0:2377').describe('Listen address'),
      advertiseAddr: z.string().optional().describe('Advertise address'),
      dataPathAddr: z.string().optional().describe('Data path address'),
    },
    async ({ joinToken, remoteAddrs, listenAddr, advertiseAddr, dataPathAddr }) => {
      try {
        await client.joinSwarm({
          joinToken,
          remoteAddrs,
          listenAddr,
          advertiseAddr,
          dataPathAddr,
        });
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: 'Joined swarm' }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Leave Swarm
  // ===========================================================================
  server.tool(
    'docker_swarm_leave',
    `Leave the swarm.

Args:
  - force: Force leave even if this is the last manager

Returns:
  Confirmation of leave.`,
    {
      force: z.boolean().default(false).describe('Force leave'),
    },
    async ({ force }) => {
      try {
        await client.leaveSwarm(force);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: 'Left swarm' }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Unlock Key
  // ===========================================================================
  server.tool(
    'docker_swarm_unlock_key',
    `Get the swarm unlock key.

Returns:
  The unlock key for the swarm.`,
    {},
    async () => {
      try {
        const result = await client.getSwarmUnlockKey();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                unlockKey: result.unlockKey,
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
  // Unlock Swarm
  // ===========================================================================
  server.tool(
    'docker_swarm_unlock',
    `Unlock a locked swarm.

Args:
  - unlockKey: The unlock key

Returns:
  Confirmation of unlock.`,
    {
      unlockKey: z.string().describe('The unlock key'),
    },
    async ({ unlockKey }) => {
      try {
        await client.unlockSwarm(unlockKey);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: 'Swarm unlocked' }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Nodes
  // ===========================================================================
  server.tool(
    'docker_list_nodes',
    `List swarm nodes.

Args:
  - role: Filter by role (worker or manager)
  - format: Response format ('json' or 'markdown')

Returns:
  List of swarm nodes.`,
    {
      role: z.enum(['worker', 'manager']).optional().describe('Filter by role'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ role, format }) => {
      try {
        const filters = role ? { role: [role] } : undefined;
        const nodes = await client.listNodes(filters);
        return formatResponse({ items: nodes, count: nodes.length, hasMore: false }, format, 'nodes');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Node
  // ===========================================================================
  server.tool(
    'docker_inspect_node',
    `Get detailed information about a node.

Args:
  - id: Node ID
  - format: Response format ('json' or 'markdown')

Returns:
  Detailed node information.`,
    {
      id: z.string().describe('Node ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ id, format }) => {
      try {
        const node = await client.inspectNode(id);
        return formatResponse(node, format, 'node');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Remove Node
  // ===========================================================================
  server.tool(
    'docker_remove_node',
    `Remove a node from the swarm.

Args:
  - id: Node ID
  - force: Force removal

Returns:
  Confirmation of removal.`,
    {
      id: z.string().describe('Node ID'),
      force: z.boolean().default(false).describe('Force removal'),
    },
    async ({ id, force }) => {
      try {
        await client.removeNode(id, force);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Node ${id} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Node
  // ===========================================================================
  server.tool(
    'docker_update_node',
    `Update a node's configuration.

Args:
  - id: Node ID
  - version: Node version (for optimistic locking)
  - role: Node role (worker or manager)
  - availability: Node availability (active, pause, drain)
  - name: Node name
  - labels: Node labels

Returns:
  Confirmation of update.`,
    {
      id: z.string().describe('Node ID'),
      version: z.number().int().describe('Node version'),
      role: z.enum(['worker', 'manager']).describe('Node role'),
      availability: z.enum(['active', 'pause', 'drain']).describe('Node availability'),
      name: z.string().optional().describe('Node name'),
      labels: z.record(z.string(), z.string()).optional().describe('Node labels'),
    },
    async ({ id, version, role, availability, name, labels }) => {
      try {
        await client.updateNode(id, version, { role, availability, name, labels });
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Node ${id} updated` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Services
  // ===========================================================================
  server.tool(
    'docker_list_services',
    `List swarm services.

Args:
  - mode: Filter by mode (replicated or global)
  - format: Response format ('json' or 'markdown')

Returns:
  List of swarm services.`,
    {
      mode: z.enum(['replicated', 'global']).optional().describe('Filter by mode'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ mode, format }) => {
      try {
        const filters = mode ? { mode: [mode] } : undefined;
        const services = await client.listServices(filters);
        return formatResponse({ items: services, count: services.length, hasMore: false }, format, 'services');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Service
  // ===========================================================================
  server.tool(
    'docker_inspect_service',
    `Get detailed information about a service.

Args:
  - id: Service ID or name
  - format: Response format ('json' or 'markdown')

Returns:
  Detailed service configuration.`,
    {
      id: z.string().describe('Service ID or name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ id, format }) => {
      try {
        const service = await client.inspectService(id);
        return formatResponse(service, format, 'service');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Service
  // ===========================================================================
  server.tool(
    'docker_create_service',
    `Create a new swarm service.

Args:
  - name: Service name
  - image: Image to use
  - replicas: Number of replicas (for replicated mode)
  - global: Run one task per node (global mode)
  - cmd: Command to run
  - env: Environment variables
  - labels: Service labels
  - publishedPorts: Ports to publish (array of {targetPort, publishedPort, protocol})

Returns:
  Created service ID.`,
    {
      name: z.string().describe('Service name'),
      image: z.string().describe('Image to use'),
      replicas: z.number().int().min(0).optional().describe('Number of replicas'),
      global: z.boolean().optional().describe('Run one task per node'),
      cmd: z.array(z.string()).optional().describe('Command to run'),
      env: z.array(z.string()).optional().describe('Environment variables'),
      labels: z.record(z.string(), z.string()).optional().describe('Service labels'),
      publishedPorts: z.array(z.object({
        targetPort: z.number().int(),
        publishedPort: z.number().int().optional(),
        protocol: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
      })).optional().describe('Ports to publish'),
    },
    async ({ name, image, replicas, global, cmd, env, labels, publishedPorts }) => {
      try {
        const result = await client.createService({
          name,
          labels,
          taskTemplate: {
            containerSpec: {
              image,
              command: cmd,
              env,
            },
          },
          mode: global ? { global: {} } : { replicated: { replicas: replicas || 1 } },
          endpointSpec: publishedPorts
            ? {
                ports: publishedPorts.map((p) => ({
                  targetPort: p.targetPort,
                  publishedPort: p.publishedPort,
                  protocol: p.protocol,
                })),
              }
            : undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Service ${name} created`,
                serviceId: result.id,
                warnings: result.warnings,
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
  // Remove Service
  // ===========================================================================
  server.tool(
    'docker_remove_service',
    `Remove a swarm service.

Args:
  - id: Service ID or name

Returns:
  Confirmation of removal.`,
    {
      id: z.string().describe('Service ID or name'),
    },
    async ({ id }) => {
      try {
        await client.removeService(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Service ${id} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Service Logs
  // ===========================================================================
  server.tool(
    'docker_service_logs',
    `Get logs from a swarm service.

Args:
  - id: Service ID or name
  - tail: Number of lines to show
  - timestamps: Include timestamps

Returns:
  Service log output.`,
    {
      id: z.string().describe('Service ID or name'),
      tail: z.number().int().min(1).default(100).describe('Number of lines'),
      timestamps: z.boolean().default(false).describe('Include timestamps'),
    },
    async ({ id, tail, timestamps }) => {
      try {
        const logs = await client.getServiceLogs(id, tail, timestamps);
        return {
          content: [{ type: 'text', text: logs || '(no logs)' }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Tasks
  // ===========================================================================
  server.tool(
    'docker_list_tasks',
    `List swarm tasks.

Args:
  - service: Filter by service ID
  - node: Filter by node ID
  - desiredState: Filter by desired state (running, shutdown, accepted)
  - format: Response format ('json' or 'markdown')

Returns:
  List of tasks.`,
    {
      service: z.string().optional().describe('Filter by service ID'),
      node: z.string().optional().describe('Filter by node ID'),
      desiredState: z.enum(['running', 'shutdown', 'accepted']).optional().describe('Filter by desired state'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ service, node, desiredState, format }) => {
      try {
        const filters: Record<string, string[]> = {};
        if (service) filters.service = [service];
        if (node) filters.node = [node];
        if (desiredState) filters['desired-state'] = [desiredState];
        const tasks = await client.listTasks(Object.keys(filters).length > 0 ? filters : undefined);
        return formatResponse({ items: tasks, count: tasks.length, hasMore: false }, format, 'tasks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Task
  // ===========================================================================
  server.tool(
    'docker_inspect_task',
    `Get detailed information about a task.

Args:
  - id: Task ID

Returns:
  Detailed task information.`,
    {
      id: z.string().describe('Task ID'),
    },
    async ({ id }) => {
      try {
        const task = await client.inspectTask(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
