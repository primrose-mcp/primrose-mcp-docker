/**
 * Container Tools
 *
 * MCP tools for Docker container management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all container-related tools
 */
export function registerContainerTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // List Containers
  // ===========================================================================
  server.tool(
    'docker_list_containers',
    `List Docker containers.

Returns a list of containers. By default only running containers are shown.

Args:
  - all: Show all containers (default shows just running)
  - limit: Maximum number of containers to return
  - format: Response format ('json' or 'markdown')

Returns:
  List of containers with ID, names, image, status, state, and ports.`,
    {
      all: z.boolean().default(false).describe('Show all containers (default shows just running)'),
      limit: z.number().int().min(1).max(1000).optional().describe('Maximum number to return'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ all, format }) => {
      try {
        const containers = await client.listContainers(all);
        return formatResponse({ items: containers, count: containers.length, hasMore: false }, format, 'containers');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Container
  // ===========================================================================
  server.tool(
    'docker_inspect_container',
    `Get detailed information about a container.

Args:
  - id: Container ID or name
  - format: Response format ('json' or 'markdown')

Returns:
  Detailed container configuration and state.`,
    {
      id: z.string().describe('Container ID or name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ id, format }) => {
      try {
        const container = await client.inspectContainer(id);
        return formatResponse(container, format, 'container');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Container
  // ===========================================================================
  server.tool(
    'docker_create_container',
    `Create a new container.

Args:
  - image: Image to use (required)
  - name: Container name
  - cmd: Command to run
  - env: Environment variables (array of KEY=VALUE)
  - ports: Port mappings (e.g., {"80/tcp": [{"HostPort": "8080"}]})
  - volumes: Volume bindings (e.g., ["/host/path:/container/path"])
  - workingDir: Working directory inside container
  - hostname: Container hostname
  - user: User to run as
  - tty: Allocate a TTY
  - labels: Container labels

Returns:
  Created container ID and any warnings.`,
    {
      image: z.string().describe('Image to use'),
      name: z.string().optional().describe('Container name'),
      cmd: z.array(z.string()).optional().describe('Command to run'),
      env: z.array(z.string()).optional().describe('Environment variables (KEY=VALUE)'),
      ports: z.record(z.string(), z.array(z.object({ HostIp: z.string().optional(), HostPort: z.string() }))).optional().describe('Port mappings'),
      volumes: z.array(z.string()).optional().describe('Volume bindings'),
      workingDir: z.string().optional().describe('Working directory'),
      hostname: z.string().optional().describe('Container hostname'),
      user: z.string().optional().describe('User to run as'),
      tty: z.boolean().optional().describe('Allocate TTY'),
      labels: z.record(z.string(), z.string()).optional().describe('Container labels'),
    },
    async (input) => {
      try {
        const portBindings = input.ports
          ? Object.fromEntries(
              Object.entries(input.ports).map(([k, v]) => [
                k,
                v.map((p) => ({ hostIp: p.HostIp, hostPort: p.HostPort })),
              ])
            )
          : undefined;
        const result = await client.createContainer({
          image: input.image,
          name: input.name,
          cmd: input.cmd,
          env: input.env,
          exposedPorts: input.ports ? Object.keys(input.ports).reduce((acc, k) => ({ ...acc, [k]: {} }), {}) : undefined,
          workingDir: input.workingDir,
          hostname: input.hostname,
          user: input.user,
          tty: input.tty,
          labels: input.labels,
          hostConfig: {
            binds: input.volumes,
            portBindings: portBindings as Record<string, Array<{ hostIp?: string; hostPort: string }>>,
          },
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Container created',
                containerId: result.id,
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
  // Start Container
  // ===========================================================================
  server.tool(
    'docker_start_container',
    `Start a stopped container.

Args:
  - id: Container ID or name

Returns:
  Confirmation of start.`,
    {
      id: z.string().describe('Container ID or name'),
    },
    async ({ id }) => {
      try {
        await client.startContainer(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} started` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Stop Container
  // ===========================================================================
  server.tool(
    'docker_stop_container',
    `Stop a running container.

Args:
  - id: Container ID or name
  - timeout: Seconds to wait before killing (default: 10)

Returns:
  Confirmation of stop.`,
    {
      id: z.string().describe('Container ID or name'),
      timeout: z.number().int().min(0).default(10).describe('Seconds to wait before killing'),
    },
    async ({ id, timeout }) => {
      try {
        await client.stopContainer(id, timeout);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} stopped` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Restart Container
  // ===========================================================================
  server.tool(
    'docker_restart_container',
    `Restart a container.

Args:
  - id: Container ID or name
  - timeout: Seconds to wait before killing (default: 10)

Returns:
  Confirmation of restart.`,
    {
      id: z.string().describe('Container ID or name'),
      timeout: z.number().int().min(0).default(10).describe('Seconds to wait before killing'),
    },
    async ({ id, timeout }) => {
      try {
        await client.restartContainer(id, timeout);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} restarted` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Kill Container
  // ===========================================================================
  server.tool(
    'docker_kill_container',
    `Kill a running container (send signal).

Args:
  - id: Container ID or name
  - signal: Signal to send (default: SIGKILL)

Returns:
  Confirmation of kill.`,
    {
      id: z.string().describe('Container ID or name'),
      signal: z.string().default('SIGKILL').describe('Signal to send'),
    },
    async ({ id, signal }) => {
      try {
        await client.killContainer(id, signal);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} killed with ${signal}` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Pause Container
  // ===========================================================================
  server.tool(
    'docker_pause_container',
    `Pause a running container.

Args:
  - id: Container ID or name

Returns:
  Confirmation of pause.`,
    {
      id: z.string().describe('Container ID or name'),
    },
    async ({ id }) => {
      try {
        await client.pauseContainer(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} paused` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Unpause Container
  // ===========================================================================
  server.tool(
    'docker_unpause_container',
    `Unpause a paused container.

Args:
  - id: Container ID or name

Returns:
  Confirmation of unpause.`,
    {
      id: z.string().describe('Container ID or name'),
    },
    async ({ id }) => {
      try {
        await client.unpauseContainer(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} unpaused` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Remove Container
  // ===========================================================================
  server.tool(
    'docker_remove_container',
    `Remove a container.

Args:
  - id: Container ID or name
  - force: Force removal of running container
  - removeVolumes: Remove associated volumes

Returns:
  Confirmation of removal.`,
    {
      id: z.string().describe('Container ID or name'),
      force: z.boolean().default(false).describe('Force removal of running container'),
      removeVolumes: z.boolean().default(false).describe('Remove associated volumes'),
    },
    async ({ id, force, removeVolumes }) => {
      try {
        await client.removeContainer(id, force, removeVolumes);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Rename Container
  // ===========================================================================
  server.tool(
    'docker_rename_container',
    `Rename a container.

Args:
  - id: Container ID or name
  - name: New name for the container

Returns:
  Confirmation of rename.`,
    {
      id: z.string().describe('Container ID or current name'),
      name: z.string().describe('New name for the container'),
    },
    async ({ id, name }) => {
      try {
        await client.renameContainer(id, name);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Container ${id} renamed to ${name}` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Container Logs
  // ===========================================================================
  server.tool(
    'docker_get_logs',
    `Get container logs.

Args:
  - id: Container ID or name
  - tail: Number of lines to show from end (default: 100)
  - timestamps: Include timestamps

Returns:
  Container log output.`,
    {
      id: z.string().describe('Container ID or name'),
      tail: z.number().int().min(1).default(100).describe('Number of lines to show'),
      timestamps: z.boolean().default(false).describe('Include timestamps'),
    },
    async ({ id, tail, timestamps }) => {
      try {
        const logs = await client.getContainerLogs(id, tail, timestamps);
        return {
          content: [{ type: 'text', text: logs || '(no logs)' }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Container Stats
  // ===========================================================================
  server.tool(
    'docker_get_stats',
    `Get container resource usage statistics.

Args:
  - id: Container ID or name
  - format: Response format ('json' or 'markdown')

Returns:
  CPU, memory, network, and I/O statistics.`,
    {
      id: z.string().describe('Container ID or name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ id, format }) => {
      try {
        const stats = await client.getContainerStats(id, false);
        return formatResponse(stats, format, 'stats');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Container Processes
  // ===========================================================================
  server.tool(
    'docker_get_top',
    `Get running processes in a container.

Args:
  - id: Container ID or name
  - psArgs: Arguments to pass to ps (default: -ef)

Returns:
  List of processes running in the container.`,
    {
      id: z.string().describe('Container ID or name'),
      psArgs: z.string().default('-ef').describe('Arguments to pass to ps'),
    },
    async ({ id, psArgs }) => {
      try {
        const result = await client.getContainerTop(id, psArgs);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Container Changes
  // ===========================================================================
  server.tool(
    'docker_get_changes',
    `Get filesystem changes in a container.

Args:
  - id: Container ID or name

Returns:
  List of changed files (0=Modified, 1=Added, 2=Deleted).`,
    {
      id: z.string().describe('Container ID or name'),
    },
    async ({ id }) => {
      try {
        const changes = await client.getContainerChanges(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(changes, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Wait for Container
  // ===========================================================================
  server.tool(
    'docker_wait_container',
    `Wait for a container to stop.

Args:
  - id: Container ID or name

Returns:
  Exit code and any error message.`,
    {
      id: z.string().describe('Container ID or name'),
    },
    async ({ id }) => {
      try {
        const result = await client.waitContainer(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Prune Containers
  // ===========================================================================
  server.tool(
    'docker_prune_containers',
    `Remove all stopped containers.

Returns:
  List of deleted container IDs and space reclaimed.`,
    {},
    async () => {
      try {
        const result = await client.pruneContainers();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                containersDeleted: result.containersDeleted,
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

  // ===========================================================================
  // Update Container
  // ===========================================================================
  server.tool(
    'docker_update_container',
    `Update container resource limits.

Args:
  - id: Container ID or name
  - cpuShares: CPU shares (relative weight)
  - memory: Memory limit in bytes
  - memorySwap: Total memory limit (memory + swap)
  - cpuPeriod: CPU CFS period
  - cpuQuota: CPU CFS quota
  - cpusetCpus: CPUs to use (e.g., "0-3" or "0,1")
  - cpusetMems: Memory nodes to use

Returns:
  Warnings from the update.`,
    {
      id: z.string().describe('Container ID or name'),
      cpuShares: z.number().int().optional().describe('CPU shares (relative weight)'),
      memory: z.number().int().optional().describe('Memory limit in bytes'),
      memorySwap: z.number().int().optional().describe('Total memory limit'),
      cpuPeriod: z.number().int().optional().describe('CPU CFS period'),
      cpuQuota: z.number().int().optional().describe('CPU CFS quota'),
      cpusetCpus: z.string().optional().describe('CPUs to use'),
      cpusetMems: z.string().optional().describe('Memory nodes to use'),
    },
    async ({ id, ...config }) => {
      try {
        const result = await client.updateContainer(id, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Container ${id} updated`,
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
}
