/**
 * Image Tools
 *
 * MCP tools for Docker image management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DockerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all image-related tools
 */
export function registerImageTools(server: McpServer, client: DockerClient): void {
  // ===========================================================================
  // List Images
  // ===========================================================================
  server.tool(
    'docker_list_images',
    `List Docker images.

Args:
  - all: Show all images (default hides intermediate images)
  - dangling: Show only dangling images
  - format: Response format ('json' or 'markdown')

Returns:
  List of images with ID, tags, size, and creation time.`,
    {
      all: z.boolean().default(false).describe('Show all images'),
      dangling: z.boolean().optional().describe('Show only dangling images'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ all, dangling, format }) => {
      try {
        const filters = dangling !== undefined ? { dangling: [dangling] } : undefined;
        const images = await client.listImages(all, filters);
        return formatResponse({ items: images, count: images.length, hasMore: false }, format, 'images');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Inspect Image
  // ===========================================================================
  server.tool(
    'docker_inspect_image',
    `Get detailed information about an image.

Args:
  - name: Image name or ID
  - format: Response format ('json' or 'markdown')

Returns:
  Detailed image configuration and metadata.`,
    {
      name: z.string().describe('Image name or ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ name, format }) => {
      try {
        const image = await client.inspectImage(name);
        return formatResponse(image, format, 'image');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Image History
  // ===========================================================================
  server.tool(
    'docker_get_image_history',
    `Get the history of an image (layers).

Args:
  - name: Image name or ID

Returns:
  List of image layers with creation info.`,
    {
      name: z.string().describe('Image name or ID'),
    },
    async ({ name }) => {
      try {
        const history = await client.getImageHistory(name);
        return {
          content: [{ type: 'text', text: JSON.stringify(history, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Pull Image
  // ===========================================================================
  server.tool(
    'docker_pull_image',
    `Pull an image from a registry.

Args:
  - image: Image name (e.g., "nginx", "ubuntu", "myregistry.com/myimage")
  - tag: Tag to pull (default: "latest")
  - username: Registry username (optional)
  - password: Registry password (optional)

Returns:
  Pull progress and result.`,
    {
      image: z.string().describe('Image name'),
      tag: z.string().default('latest').describe('Tag to pull'),
      username: z.string().optional().describe('Registry username'),
      password: z.string().optional().describe('Registry password'),
    },
    async ({ image, tag, username, password }) => {
      try {
        const auth = username && password ? { username, password } : undefined;
        const result = await client.pullImage(image, tag, auth);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Image ${image}:${tag} pulled`,
                output: result,
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
  // Push Image
  // ===========================================================================
  server.tool(
    'docker_push_image',
    `Push an image to a registry.

Args:
  - name: Image name (e.g., "myregistry.com/myimage")
  - tag: Tag to push (optional)
  - username: Registry username
  - password: Registry password

Returns:
  Push progress and result.`,
    {
      name: z.string().describe('Image name'),
      tag: z.string().optional().describe('Tag to push'),
      username: z.string().describe('Registry username'),
      password: z.string().describe('Registry password'),
    },
    async ({ name, tag, username, password }) => {
      try {
        const result = await client.pushImage(name, tag, { username, password });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Image ${name}${tag ? ':' + tag : ''} pushed`,
                output: result,
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
  // Tag Image
  // ===========================================================================
  server.tool(
    'docker_tag_image',
    `Tag an image.

Args:
  - name: Source image name or ID
  - repo: Target repository name
  - tag: Target tag (default: "latest")

Returns:
  Confirmation of tagging.`,
    {
      name: z.string().describe('Source image name or ID'),
      repo: z.string().describe('Target repository name'),
      tag: z.string().default('latest').describe('Target tag'),
    },
    async ({ name, repo, tag }) => {
      try {
        await client.tagImage(name, repo, tag);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Image ${name} tagged as ${repo}:${tag}`,
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
  // Remove Image
  // ===========================================================================
  server.tool(
    'docker_remove_image',
    `Remove an image.

Args:
  - name: Image name or ID
  - force: Force removal
  - noPrune: Don't delete untagged parents

Returns:
  List of deleted/untagged layers.`,
    {
      name: z.string().describe('Image name or ID'),
      force: z.boolean().default(false).describe('Force removal'),
      noPrune: z.boolean().default(false).describe("Don't delete untagged parents"),
    },
    async ({ name, force, noPrune }) => {
      try {
        const result = await client.removeImage(name, force, noPrune);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Image ${name} removed`,
                deleted: result,
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
  // Search Images
  // ===========================================================================
  server.tool(
    'docker_search_images',
    `Search Docker Hub for images.

Args:
  - term: Search term
  - limit: Maximum results (default: 25)
  - format: Response format ('json' or 'markdown')

Returns:
  List of matching images from Docker Hub.`,
    {
      term: z.string().describe('Search term'),
      limit: z.number().int().min(1).max(100).default(25).describe('Maximum results'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ term, limit, format }) => {
      try {
        const results = await client.searchImages(term, limit);
        return formatResponse({ items: results, count: results.length, hasMore: false }, format, 'search_results');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Prune Images
  // ===========================================================================
  server.tool(
    'docker_prune_images',
    `Remove unused images.

Args:
  - dangling: Only remove dangling images (default: true)

Returns:
  List of deleted images and space reclaimed.`,
    {
      dangling: z.boolean().default(true).describe('Only remove dangling images'),
    },
    async ({ dangling }) => {
      try {
        const result = await client.pruneImages(dangling);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                imagesDeleted: result.imagesDeleted,
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
