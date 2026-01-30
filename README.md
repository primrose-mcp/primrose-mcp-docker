# Docker MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/docker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Docker. Manage containers, images, networks, volumes, and Docker Hub repositories through a standardized interface.

## Features

- **Container Management** - Create, start, stop, and manage containers
- **Exec Operations** - Execute commands inside running containers
- **Docker Hub Integration** - Search and manage Docker Hub repositories
- **Image Management** - Build, pull, push, and manage images
- **Network Configuration** - Create and manage Docker networks
- **Plugin Management** - Install and configure Docker plugins
- **Secrets & Configs** - Manage Docker secrets and configs
- **Swarm Operations** - Work with Docker Swarm clusters
- **System Information** - Get Docker system info and events
- **Volume Management** - Create and manage storage volumes

## Quick Start

The recommended way to use this MCP server is through the [Primrose SDK](https://www.npmjs.com/package/primrose-mcp):

```bash
npm install primrose-mcp
```

```typescript
import { PrimroseClient } from 'primrose-mcp';

const client = new PrimroseClient({
  service: 'docker',
  headers: {
    'X-Docker-Host': 'tcp://localhost:2375'
  }
});

// List all containers
const containers = await client.call('docker_list_containers', {});
```

## Manual Installation

If you prefer to run the MCP server directly:

```bash
# Clone the repository
git clone https://github.com/primrose-ai/primrose-mcp-docker.git
cd primrose-mcp-docker

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Configuration

### Required Headers (one of)

| Header | Description |
|--------|-------------|
| `X-Docker-Host` | Docker Engine API host (e.g., tcp://host:2375) |
| `X-Docker-Hub-Token` | Docker Hub API token |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Docker-TLS-Verify` | Enable TLS verification (1/0) |
| `X-Docker-Cert-Path` | Path to TLS certificates |
| `X-Docker-Hub-Username` | Docker Hub username |

### Docker Engine Configuration

To expose Docker Engine API over TCP:

```bash
# Edit Docker daemon configuration
# /etc/docker/daemon.json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
```

**Warning**: Exposing Docker API without TLS in production is a security risk. Use TLS in production environments.

### Getting Docker Hub Token

1. Log in to [Docker Hub](https://hub.docker.com)
2. Go to Account Settings > Security
3. Click "New Access Token"
4. Give it a description and select permissions
5. Copy the token

## Available Tools

### Container Tools
- `docker_list_containers` - List all containers
- `docker_get_container` - Get container details
- `docker_create_container` - Create a new container
- `docker_start_container` - Start a container
- `docker_stop_container` - Stop a container
- `docker_restart_container` - Restart a container
- `docker_remove_container` - Remove a container
- `docker_get_container_logs` - Get container logs
- `docker_get_container_stats` - Get container stats

### Exec Tools
- `docker_create_exec` - Create an exec instance
- `docker_start_exec` - Start an exec instance
- `docker_exec_command` - Execute a command in a container

### Docker Hub Tools
- `docker_hub_search` - Search Docker Hub
- `docker_hub_get_repository` - Get repository details
- `docker_hub_list_tags` - List repository tags
- `docker_hub_get_tag` - Get tag details

### Image Tools
- `docker_list_images` - List all images
- `docker_get_image` - Get image details
- `docker_pull_image` - Pull an image
- `docker_push_image` - Push an image
- `docker_tag_image` - Tag an image
- `docker_remove_image` - Remove an image
- `docker_build_image` - Build an image

### Network Tools
- `docker_list_networks` - List all networks
- `docker_get_network` - Get network details
- `docker_create_network` - Create a network
- `docker_remove_network` - Remove a network
- `docker_connect_network` - Connect container to network
- `docker_disconnect_network` - Disconnect from network

### Plugin Tools
- `docker_list_plugins` - List installed plugins
- `docker_get_plugin` - Get plugin details
- `docker_install_plugin` - Install a plugin
- `docker_enable_plugin` - Enable a plugin
- `docker_disable_plugin` - Disable a plugin

### Secrets & Configs Tools
- `docker_list_secrets` - List secrets
- `docker_create_secret` - Create a secret
- `docker_remove_secret` - Remove a secret
- `docker_list_configs` - List configs
- `docker_create_config` - Create a config
- `docker_remove_config` - Remove a config

### Swarm Tools
- `docker_swarm_info` - Get Swarm info
- `docker_swarm_init` - Initialize Swarm
- `docker_swarm_join` - Join Swarm cluster
- `docker_swarm_leave` - Leave Swarm cluster
- `docker_list_services` - List Swarm services
- `docker_create_service` - Create a service

### System Tools
- `docker_system_info` - Get system information
- `docker_system_version` - Get Docker version
- `docker_system_df` - Get disk usage
- `docker_system_events` - Get system events
- `docker_system_prune` - Prune unused resources

### Volume Tools
- `docker_list_volumes` - List all volumes
- `docker_get_volume` - Get volume details
- `docker_create_volume` - Create a volume
- `docker_remove_volume` - Remove a volume
- `docker_prune_volumes` - Prune unused volumes

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Related Resources

- [Primrose SDK Documentation](https://primrose.dev/docs)
- [Docker Engine API Documentation](https://docs.docker.com/engine/api/)
- [Docker Hub API Documentation](https://docs.docker.com/docker-hub/api/)
- [Model Context Protocol](https://modelcontextprotocol.io)
