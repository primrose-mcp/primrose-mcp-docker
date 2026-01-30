/**
 * Response Formatting Utilities
 *
 * Helpers for formatting tool responses in JSON or Markdown.
 */

import type {
  Config,
  Container,
  Image,
  Network,
  PaginatedResponse,
  Plugin,
  ResponseFormat,
  Secret,
  Service,
  SwarmNode,
  Task,
  Volume,
} from '../types/entities.js';
import { DockerApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 * Note: Index signature required for MCP SDK 1.25+ compatibility
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof DockerApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).items)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');

  if (data.total !== undefined) {
    lines.push(`**Total:** ${data.total} | **Showing:** ${data.count}`);
  } else {
    lines.push(`**Showing:** ${data.count}`);
  }

  if (data.hasMore) {
    lines.push(`**More available:** Yes (cursor: \`${data.nextCursor}\`)`);
  }
  lines.push('');

  if (data.items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Format items based on entity type
  switch (entityType) {
    case 'containers':
      lines.push(formatContainersTable(data.items as Container[]));
      break;
    case 'images':
      lines.push(formatImagesTable(data.items as Image[]));
      break;
    case 'networks':
      lines.push(formatNetworksTable(data.items as Network[]));
      break;
    case 'volumes':
      lines.push(formatVolumesTable(data.items as Volume[]));
      break;
    case 'services':
      lines.push(formatServicesTable(data.items as Service[]));
      break;
    case 'nodes':
      lines.push(formatNodesTable(data.items as SwarmNode[]));
      break;
    case 'tasks':
      lines.push(formatTasksTable(data.items as Task[]));
      break;
    case 'secrets':
      lines.push(formatSecretsTable(data.items as Secret[]));
      break;
    case 'configs':
      lines.push(formatConfigsTable(data.items as Config[]));
      break;
    case 'plugins':
      lines.push(formatPluginsTable(data.items as Plugin[]));
      break;
    default:
      lines.push(formatGenericTable(data.items));
  }

  return lines.join('\n');
}

/**
 * Format containers as Markdown table
 */
function formatContainersTable(containers: Container[]): string {
  const lines: string[] = [];
  lines.push('| ID | Names | Image | Status | State | Ports |');
  lines.push('|---|---|---|---|---|---|');

  for (const container of containers) {
    const names = container.names.map((n) => n.replace(/^\//, '')).join(', ') || '-';
    const ports =
      container.ports
        .map((p) => (p.publicPort ? `${p.publicPort}:${p.privatePort}/${p.type}` : `${p.privatePort}/${p.type}`))
        .join(', ') || '-';
    lines.push(
      `| ${container.id.substring(0, 12)} | ${names} | ${container.image} | ${container.status} | ${container.state} | ${ports} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format images as Markdown table
 */
function formatImagesTable(images: Image[]): string {
  const lines: string[] = [];
  lines.push('| ID | Repository:Tag | Size | Created |');
  lines.push('|---|---|---|---|');

  for (const image of images) {
    const tags = image.repoTags?.join(', ') || '<none>';
    const size = formatBytes(image.size);
    const created = formatTimestamp(image.created);
    lines.push(`| ${image.id.substring(7, 19)} | ${tags} | ${size} | ${created} |`);
  }

  return lines.join('\n');
}

/**
 * Format networks as Markdown table
 */
function formatNetworksTable(networks: Network[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Driver | Scope | IPv6 |');
  lines.push('|---|---|---|---|---|');

  for (const network of networks) {
    lines.push(
      `| ${network.id.substring(0, 12)} | ${network.name} | ${network.driver} | ${network.scope} | ${network.enableIPv6 ? 'Yes' : 'No'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format volumes as Markdown table
 */
function formatVolumesTable(volumes: Volume[]): string {
  const lines: string[] = [];
  lines.push('| Name | Driver | Scope | Mountpoint |');
  lines.push('|---|---|---|---|');

  for (const volume of volumes) {
    lines.push(
      `| ${volume.name} | ${volume.driver} | ${volume.scope} | ${volume.mountpoint} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format services as Markdown table
 */
function formatServicesTable(services: Service[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Mode | Replicas | Image |');
  lines.push('|---|---|---|---|---|');

  for (const service of services) {
    const mode = service.spec.mode?.replicated
      ? `replicated (${service.spec.mode.replicated.replicas})`
      : 'global';
    const image = service.spec.taskTemplate.containerSpec?.image || '-';
    lines.push(`| ${service.id.substring(0, 12)} | ${service.spec.name} | ${mode} | - | ${image} |`);
  }

  return lines.join('\n');
}

/**
 * Format nodes as Markdown table
 */
function formatNodesTable(nodes: SwarmNode[]): string {
  const lines: string[] = [];
  lines.push('| ID | Hostname | Status | Availability | Role | Manager |');
  lines.push('|---|---|---|---|---|---|');

  for (const node of nodes) {
    const isManager = node.managerStatus ? 'Yes' : 'No';
    lines.push(
      `| ${node.id.substring(0, 12)} | ${node.description.hostname} | ${node.status.state} | ${node.spec.availability} | ${node.spec.role} | ${isManager} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format tasks as Markdown table
 */
function formatTasksTable(tasks: Task[]): string {
  const lines: string[] = [];
  lines.push('| ID | Service | Node | State | Desired |');
  lines.push('|---|---|---|---|---|');

  for (const task of tasks) {
    lines.push(
      `| ${task.id.substring(0, 12)} | ${task.serviceId.substring(0, 12)} | ${task.nodeId?.substring(0, 12) || '-'} | ${task.status.state} | ${task.desiredState} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format secrets as Markdown table
 */
function formatSecretsTable(secrets: Secret[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Created | Updated |');
  lines.push('|---|---|---|---|');

  for (const secret of secrets) {
    lines.push(
      `| ${secret.id.substring(0, 12)} | ${secret.spec.name} | ${secret.createdAt} | ${secret.updatedAt} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format configs as Markdown table
 */
function formatConfigsTable(configs: Config[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Created | Updated |');
  lines.push('|---|---|---|---|');

  for (const config of configs) {
    lines.push(
      `| ${config.id.substring(0, 12)} | ${config.spec.name} | ${config.createdAt} | ${config.updatedAt} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format plugins as Markdown table
 */
function formatPluginsTable(plugins: Plugin[]): string {
  const lines: string[] = [];
  lines.push('| Name | Enabled | Description |');
  lines.push('|---|---|---|');

  for (const plugin of plugins) {
    lines.push(
      `| ${plugin.name} | ${plugin.enabled ? 'Yes' : 'No'} | ${plugin.config.description.substring(0, 50)} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5); // Limit columns

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => String(record[k] ?? '-').substring(0, 30));
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  switch (entityType) {
    case 'containers':
      return formatContainersTable(data as Container[]);
    case 'images':
      return formatImagesTable(data as Image[]);
    case 'networks':
      return formatNetworksTable(data as Network[]);
    case 'volumes':
      return formatVolumesTable(data as Volume[]);
    default:
      return formatGenericTable(data);
  }
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, ''))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      lines.push(`**${formatKey(key)}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formatKey(key)}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (camelCase to Title Case)
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format Unix timestamp to human readable
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

  return date.toISOString().split('T')[0];
}
