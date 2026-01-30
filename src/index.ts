/**
 * Docker MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 * It supports both stateless (McpServer) and stateful (McpAgent) modes.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (Docker hosts, Hub tokens, etc.) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers (one of):
 * - X-Docker-Host: Docker Engine API host (e.g., tcp://host:2375)
 * - X-Docker-Hub-Token: Docker Hub API token
 *
 * Optional Headers:
 * - X-Docker-TLS-Verify: Enable TLS verification (1/0)
 * - X-Docker-Cert-Path: Path to TLS certificates
 * - X-Docker-API-Version: Docker API version (default: v1.47)
 * - X-Docker-Hub-Username: Docker Hub username
 * - X-Docker-Hub-Password: Docker Hub password
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createDockerClient } from './client.js';
import {
  registerContainerTools,
  registerExecTools,
  registerHubTools,
  registerImageTools,
  registerNetworkTools,
  registerPluginTools,
  registerSecretsConfigsTools,
  registerSwarmTools,
  registerSystemTools,
  registerVolumeTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  hasDockerEngineCredentials,
  hasDockerHubCredentials,
  parseTenantCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-docker';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode (Option 2) instead.
 * The stateful McpAgent is better suited for single-tenant deployments where
 * credentials can be stored as wrangler secrets.
 *
 * @deprecated For multi-tenant support, use stateless mode with per-request credentials
 */
export class DockerMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-Docker-Host header instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides credentials via headers, allowing
 * a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createDockerClient(credentials);

  // Register Docker Engine tools if credentials are available
  if (hasDockerEngineCredentials(credentials)) {
    registerContainerTools(server, client);
    registerImageTools(server, client);
    registerNetworkTools(server, client);
    registerVolumeTools(server, client);
    registerSystemTools(server, client);
    registerExecTools(server, client);
    registerSwarmTools(server, client);
    registerSecretsConfigsTools(server, client);
    registerPluginTools(server, client);
  }

  // Register Docker Hub tools if credentials are available
  if (hasDockerHubCredentials(credentials)) {
    registerHubTools(server, client);
  }

  // Always register test connection tool
  server.tool('docker_test_connection', 'Test the connection to Docker', {}, async () => {
    try {
      const result = await client.testConnection();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Stateless MCP with Streamable HTTP (Recommended for multi-tenant)
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Check if any credentials are provided
      const hasEngineCredentials = hasDockerEngineCredentials(credentials);
      const hasHubCredentials = hasDockerHubCredentials(credentials);

      if (!hasEngineCredentials && !hasHubCredentials) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'No credentials provided. Provide either X-Docker-Host for Docker Engine operations or X-Docker-Hub-Token for Docker Hub operations.',
            required_headers: {
              docker_engine: 'X-Docker-Host',
              docker_hub: 'X-Docker-Hub-Token or (X-Docker-Hub-Username + X-Docker-Hub-Password)',
            },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Docker MCP Server for managing Docker containers, images, networks, volumes, and Docker Hub repositories.',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          docker_engine: {
            required: 'X-Docker-Host - Docker daemon URL (e.g., tcp://host:2375)',
            optional: {
              'X-Docker-TLS-Verify': 'Enable TLS verification (1/0)',
              'X-Docker-Cert-Path': 'Path to TLS certificates',
              'X-Docker-API-Version': 'Docker API version (default: v1.47)',
            },
          },
          docker_hub: {
            option_1: 'X-Docker-Hub-Token - Docker Hub API token',
            option_2: 'X-Docker-Hub-Username + X-Docker-Hub-Password',
          },
        },
        tools: {
          containers: [
            'docker_list_containers',
            'docker_inspect_container',
            'docker_create_container',
            'docker_start_container',
            'docker_stop_container',
            'docker_restart_container',
            'docker_kill_container',
            'docker_pause_container',
            'docker_unpause_container',
            'docker_remove_container',
            'docker_rename_container',
            'docker_get_logs',
            'docker_get_stats',
            'docker_get_top',
            'docker_get_changes',
            'docker_wait_container',
            'docker_prune_containers',
            'docker_update_container',
          ],
          images: [
            'docker_list_images',
            'docker_inspect_image',
            'docker_get_image_history',
            'docker_pull_image',
            'docker_push_image',
            'docker_tag_image',
            'docker_remove_image',
            'docker_search_images',
            'docker_prune_images',
          ],
          networks: [
            'docker_list_networks',
            'docker_inspect_network',
            'docker_create_network',
            'docker_remove_network',
            'docker_connect_network',
            'docker_disconnect_network',
            'docker_prune_networks',
          ],
          volumes: [
            'docker_list_volumes',
            'docker_inspect_volume',
            'docker_create_volume',
            'docker_remove_volume',
            'docker_prune_volumes',
          ],
          exec: [
            'docker_exec',
            'docker_create_exec',
            'docker_start_exec',
            'docker_inspect_exec',
            'docker_resize_exec',
          ],
          system: [
            'docker_system_info',
            'docker_version',
            'docker_ping',
            'docker_disk_usage',
            'docker_events',
            'docker_auth',
          ],
          swarm: [
            'docker_swarm_inspect',
            'docker_swarm_init',
            'docker_swarm_join',
            'docker_swarm_leave',
            'docker_swarm_unlock_key',
            'docker_swarm_unlock',
            'docker_list_nodes',
            'docker_inspect_node',
            'docker_remove_node',
            'docker_update_node',
            'docker_list_services',
            'docker_inspect_service',
            'docker_create_service',
            'docker_remove_service',
            'docker_service_logs',
            'docker_list_tasks',
            'docker_inspect_task',
          ],
          secrets_configs: [
            'docker_list_secrets',
            'docker_inspect_secret',
            'docker_create_secret',
            'docker_remove_secret',
            'docker_list_configs',
            'docker_inspect_config',
            'docker_create_config',
            'docker_remove_config',
          ],
          plugins: [
            'docker_list_plugins',
            'docker_inspect_plugin',
            'docker_plugin_privileges',
            'docker_install_plugin',
            'docker_enable_plugin',
            'docker_disable_plugin',
            'docker_remove_plugin',
            'docker_upgrade_plugin',
            'docker_configure_plugin',
          ],
          docker_hub: [
            'docker_hub_login',
            'docker_hub_list_repos',
            'docker_hub_get_repo',
            'docker_hub_list_tags',
            'docker_hub_get_tag',
            'docker_hub_delete_tag',
            'docker_hub_list_webhooks',
            'docker_hub_create_webhook',
            'docker_hub_delete_webhook',
            'docker_hub_build_settings',
            'docker_hub_build_history',
            'docker_hub_trigger_build',
          ],
          utility: [
            'docker_test_connection',
          ],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
