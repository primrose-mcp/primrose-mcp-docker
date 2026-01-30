/**
 * Docker Hub Tools
 *
 * MCP tools for Docker Hub operations.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all Docker Hub related tools
 */
export function registerHubTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // Login to Docker Hub
  // ===========================================================================
  server.tool(
    'docker_hub_login',
    `Login to Docker Hub.

Args:
  - username: Docker Hub username
  - password: Docker Hub password

Returns:
  Authentication token.`,
    {
      username: z.string().describe('Docker Hub username'),
      password: z.string().describe('Docker Hub password'),
    },
    async ({ username, password }) => {
      try {
        const token = await client.hubLogin(username, password);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Logged in to Docker Hub',
                tokenLength: token.length,
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
  // List Repositories
  // ===========================================================================
  server.tool(
    'docker_hub_list_repos',
    `List repositories in a Docker Hub namespace.

Args:
  - namespace: Docker Hub namespace (username or organization)
  - page: Page number (default: 1)
  - pageSize: Items per page (default: 25)
  - format: Response format ('json' or 'markdown')

Returns:
  List of repositories with name, description, stars, and pull count.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      page: z.number().int().min(1).default(1).describe('Page number'),
      pageSize: z.number().int().min(1).max(100).default(25).describe('Items per page'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ namespace, page, pageSize, format }) => {
      try {
        const result = await client.hubGetRepositories(namespace, page, pageSize);
        return formatResponse(result, format, 'repositories');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Repository
  // ===========================================================================
  server.tool(
    'docker_hub_get_repo',
    `Get details of a Docker Hub repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - format: Response format ('json' or 'markdown')

Returns:
  Repository details including description, stars, and pull count.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ namespace, repository, format }) => {
      try {
        const repo = await client.hubGetRepository(namespace, repository);
        return formatResponse(repo, format, 'repository');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Tags
  // ===========================================================================
  server.tool(
    'docker_hub_list_tags',
    `List tags for a Docker Hub repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - page: Page number (default: 1)
  - pageSize: Items per page (default: 25)
  - format: Response format ('json' or 'markdown')

Returns:
  List of tags with name, size, and last updated time.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      page: z.number().int().min(1).default(1).describe('Page number'),
      pageSize: z.number().int().min(1).max(100).default(25).describe('Items per page'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ namespace, repository, page, pageSize, format }) => {
      try {
        const result = await client.hubGetTags(namespace, repository, page, pageSize);
        return formatResponse(result, format, 'tags');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Tag
  // ===========================================================================
  server.tool(
    'docker_hub_get_tag',
    `Get details of a specific tag.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - tag: Tag name

Returns:
  Tag details including images for each architecture.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      tag: z.string().describe('Tag name'),
    },
    async ({ namespace, repository, tag }) => {
      try {
        const tagInfo = await client.hubGetTag(namespace, repository, tag);
        return {
          content: [{ type: 'text', text: JSON.stringify(tagInfo, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Tag
  // ===========================================================================
  server.tool(
    'docker_hub_delete_tag',
    `Delete a tag from a Docker Hub repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - tag: Tag name

Returns:
  Confirmation of deletion.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      tag: z.string().describe('Tag name'),
    },
    async ({ namespace, repository, tag }) => {
      try {
        await client.hubDeleteTag(namespace, repository, tag);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Tag ${namespace}/${repository}:${tag} deleted`,
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
  // List Webhooks
  // ===========================================================================
  server.tool(
    'docker_hub_list_webhooks',
    `List webhooks for a Docker Hub repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name

Returns:
  List of webhooks with name and URL.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
    },
    async ({ namespace, repository }) => {
      try {
        const webhooks = await client.hubGetWebhooks(namespace, repository);
        return {
          content: [{ type: 'text', text: JSON.stringify(webhooks, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Webhook
  // ===========================================================================
  server.tool(
    'docker_hub_create_webhook',
    `Create a webhook for a Docker Hub repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - name: Webhook name
  - webhookUrl: URL to call when triggered

Returns:
  Created webhook details.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      name: z.string().describe('Webhook name'),
      webhookUrl: z.string().url().describe('URL to call'),
    },
    async ({ namespace, repository, name, webhookUrl }) => {
      try {
        const webhook = await client.hubCreateWebhook(namespace, repository, {
          name,
          webhooks: [{ hookUrl: webhookUrl }],
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Webhook ${name} created`,
                webhook,
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
  // Delete Webhook
  // ===========================================================================
  server.tool(
    'docker_hub_delete_webhook',
    `Delete a webhook from a Docker Hub repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - webhookId: Webhook ID

Returns:
  Confirmation of deletion.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      webhookId: z.number().int().describe('Webhook ID'),
    },
    async ({ namespace, repository, webhookId }) => {
      try {
        await client.hubDeleteWebhook(namespace, repository, webhookId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Webhook ${webhookId} deleted`,
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
  // Get Build Settings
  // ===========================================================================
  server.tool(
    'docker_hub_build_settings',
    `Get automated build settings for a repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name

Returns:
  Build settings including build tags and autotests configuration.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
    },
    async ({ namespace, repository }) => {
      try {
        const settings = await client.hubGetBuildSettings(namespace, repository);
        return {
          content: [{ type: 'text', text: JSON.stringify(settings, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Build History
  // ===========================================================================
  server.tool(
    'docker_hub_build_history',
    `Get build history for a repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - page: Page number (default: 1)
  - pageSize: Items per page (default: 25)

Returns:
  List of builds with status, tag, and timestamps.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      page: z.number().int().min(1).default(1).describe('Page number'),
      pageSize: z.number().int().min(1).max(100).default(25).describe('Items per page'),
    },
    async ({ namespace, repository, page, pageSize }) => {
      try {
        const history = await client.hubGetBuildHistory(namespace, repository, page, pageSize);
        return {
          content: [{ type: 'text', text: JSON.stringify(history, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Trigger Build
  // ===========================================================================
  server.tool(
    'docker_hub_trigger_build',
    `Trigger an automated build for a repository.

Args:
  - namespace: Docker Hub namespace
  - repository: Repository name
  - sourceType: Source type (Branch or Tag)
  - sourceName: Source name (branch or tag name)

Returns:
  Confirmation of build trigger.`,
    {
      namespace: z.string().describe('Docker Hub namespace'),
      repository: z.string().describe('Repository name'),
      sourceType: z.enum(['Branch', 'Tag']).default('Branch').describe('Source type'),
      sourceName: z.string().default('main').describe('Source name'),
    },
    async ({ namespace, repository, sourceType, sourceName }) => {
      try {
        await client.hubTriggerBuild(namespace, repository, sourceType, sourceName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Build triggered for ${namespace}/${repository} from ${sourceType} ${sourceName}`,
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
