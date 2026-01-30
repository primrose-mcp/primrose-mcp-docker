/**
 * Exec Tools
 *
 * MCP tools for executing commands in Docker containers.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError } from '../utils/formatters.js';

/**
 * Register all exec-related tools
 */
export function registerExecTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // Execute Command
  // ===========================================================================
  server.tool(
    'docker_exec',
    `Execute a command in a running container.

This is a convenience tool that creates and starts an exec instance.

Args:
  - containerId: Container ID or name
  - cmd: Command to execute (array of strings)
  - workingDir: Working directory inside container
  - user: User to run as
  - env: Environment variables (array of KEY=VALUE)
  - privileged: Run in privileged mode
  - tty: Allocate a TTY

Returns:
  Command output.`,
    {
      containerId: z.string().describe('Container ID or name'),
      cmd: z.array(z.string()).describe('Command to execute'),
      workingDir: z.string().optional().describe('Working directory'),
      user: z.string().optional().describe('User to run as'),
      env: z.array(z.string()).optional().describe('Environment variables'),
      privileged: z.boolean().default(false).describe('Run in privileged mode'),
      tty: z.boolean().default(false).describe('Allocate a TTY'),
    },
    async ({ containerId, cmd, workingDir, user, env, privileged, tty }) => {
      try {
        // Create exec instance
        const { id } = await client.createExec(containerId, {
          cmd,
          workingDir,
          user,
          env,
          privileged,
          tty,
          attachStdout: true,
          attachStderr: true,
        });

        // Start exec and get output
        const output = await client.startExec(id, false, tty);

        return {
          content: [
            {
              type: 'text',
              text: output || '(no output)',
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Exec Instance
  // ===========================================================================
  server.tool(
    'docker_create_exec',
    `Create an exec instance in a container.

This creates an exec instance that can be started later.

Args:
  - containerId: Container ID or name
  - cmd: Command to execute (array of strings)
  - workingDir: Working directory inside container
  - user: User to run as
  - env: Environment variables (array of KEY=VALUE)
  - privileged: Run in privileged mode
  - tty: Allocate a TTY
  - attachStdin: Attach stdin
  - attachStdout: Attach stdout
  - attachStderr: Attach stderr
  - detachKeys: Escape keys for detach

Returns:
  Exec instance ID.`,
    {
      containerId: z.string().describe('Container ID or name'),
      cmd: z.array(z.string()).describe('Command to execute'),
      workingDir: z.string().optional().describe('Working directory'),
      user: z.string().optional().describe('User to run as'),
      env: z.array(z.string()).optional().describe('Environment variables'),
      privileged: z.boolean().default(false).describe('Run in privileged mode'),
      tty: z.boolean().default(false).describe('Allocate a TTY'),
      attachStdin: z.boolean().default(false).describe('Attach stdin'),
      attachStdout: z.boolean().default(true).describe('Attach stdout'),
      attachStderr: z.boolean().default(true).describe('Attach stderr'),
      detachKeys: z.string().optional().describe('Escape keys for detach'),
    },
    async ({ containerId, cmd, workingDir, user, env, privileged, tty, attachStdin, attachStdout, attachStderr, detachKeys }) => {
      try {
        const result = await client.createExec(containerId, {
          cmd,
          workingDir,
          user,
          env,
          privileged,
          tty,
          attachStdin,
          attachStdout,
          attachStderr,
          detachKeys,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Exec instance created',
                execId: result.id,
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
  // Start Exec Instance
  // ===========================================================================
  server.tool(
    'docker_start_exec',
    `Start a previously created exec instance.

Args:
  - id: Exec instance ID
  - detach: Detach from the exec
  - tty: Allocate a TTY

Returns:
  Command output (if not detached).`,
    {
      id: z.string().describe('Exec instance ID'),
      detach: z.boolean().default(false).describe('Detach from the exec'),
      tty: z.boolean().default(false).describe('Allocate a TTY'),
    },
    async ({ id, detach, tty }) => {
      try {
        const output = await client.startExec(id, detach, tty);

        if (detach) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Exec started in detached mode',
                }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: output || '(no output)',
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Exec Instance
  // ===========================================================================
  server.tool(
    'docker_inspect_exec',
    `Get information about an exec instance.

Args:
  - id: Exec instance ID

Returns:
  Exec instance details including running state and exit code.`,
    {
      id: z.string().describe('Exec instance ID'),
    },
    async ({ id }) => {
      try {
        const info = await client.inspectExec(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Resize Exec TTY
  // ===========================================================================
  server.tool(
    'docker_resize_exec',
    `Resize the TTY of an exec instance.

Args:
  - id: Exec instance ID
  - height: TTY height
  - width: TTY width

Returns:
  Confirmation of resize.`,
    {
      id: z.string().describe('Exec instance ID'),
      height: z.number().int().min(1).describe('TTY height'),
      width: z.number().int().min(1).describe('TTY width'),
    },
    async ({ id, height, width }) => {
      try {
        await client.resizeExec(id, height, width);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Exec TTY resized to ${width}x${height}`,
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
