/**
 * Secrets and Configs Tools
 *
 * MCP tools for Docker secrets and configs management (Swarm mode).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all secrets and configs related tools
 */
export function registerSecretsConfigsTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // Secrets
  // ===========================================================================

  server.tool(
    'docker_list_secrets',
    `List Docker secrets (Swarm mode).

Args:
  - format: Response format ('json' or 'markdown')

Returns:
  List of secrets with ID and name.`,
    {
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ format }) => {
      try {
        const secrets = await client.listSecrets();
        return formatResponse({ items: secrets, count: secrets.length, hasMore: false }, format, 'secrets');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'docker_inspect_secret',
    `Get detailed information about a secret.

Args:
  - id: Secret ID or name

Returns:
  Secret metadata (not the secret data itself).`,
    {
      id: z.string().describe('Secret ID or name'),
    },
    async ({ id }) => {
      try {
        const secret = await client.inspectSecret(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(secret, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'docker_create_secret',
    `Create a new secret.

Args:
  - name: Secret name
  - data: Secret data (will be base64 encoded)
  - labels: Secret labels

Returns:
  Created secret ID.`,
    {
      name: z.string().describe('Secret name'),
      data: z.string().describe('Secret data'),
      labels: z.record(z.string(), z.string()).optional().describe('Secret labels'),
    },
    async ({ name, data, labels }) => {
      try {
        // Base64 encode the data
        const encodedData = btoa(data);
        const result = await client.createSecret({ name, data: encodedData, labels });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Secret ${name} created`,
                secretId: result.id,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'docker_remove_secret',
    `Remove a secret.

Args:
  - id: Secret ID or name

Returns:
  Confirmation of removal.`,
    {
      id: z.string().describe('Secret ID or name'),
    },
    async ({ id }) => {
      try {
        await client.removeSecret(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Secret ${id} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Configs
  // ===========================================================================

  server.tool(
    'docker_list_configs',
    `List Docker configs (Swarm mode).

Args:
  - format: Response format ('json' or 'markdown')

Returns:
  List of configs with ID and name.`,
    {
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ format }) => {
      try {
        const configs = await client.listConfigs();
        return formatResponse({ items: configs, count: configs.length, hasMore: false }, format, 'configs');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'docker_inspect_config',
    `Get detailed information about a config.

Args:
  - id: Config ID or name

Returns:
  Config details including data.`,
    {
      id: z.string().describe('Config ID or name'),
    },
    async ({ id }) => {
      try {
        const config = await client.inspectConfig(id);
        return {
          content: [{ type: 'text', text: JSON.stringify(config, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'docker_create_config',
    `Create a new config.

Args:
  - name: Config name
  - data: Config data (will be base64 encoded)
  - labels: Config labels

Returns:
  Created config ID.`,
    {
      name: z.string().describe('Config name'),
      data: z.string().describe('Config data'),
      labels: z.record(z.string(), z.string()).optional().describe('Config labels'),
    },
    async ({ name, data, labels }) => {
      try {
        // Base64 encode the data
        const encodedData = btoa(data);
        const result = await client.createConfig({ name, data: encodedData, labels });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Config ${name} created`,
                configId: result.id,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'docker_remove_config',
    `Remove a config.

Args:
  - id: Config ID or name

Returns:
  Confirmation of removal.`,
    {
      id: z.string().describe('Config ID or name'),
    },
    async ({ id }) => {
      try {
        await client.removeConfig(id);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, message: `Config ${id} removed` }, null, 2) },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
