/**
 * Docker API Client
 *
 * Handles all HTTP communication with the Docker Engine API and Docker Hub API.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different Docker hosts.
 */

import type {
  AuthConfig,
  AuthResponse,
  Config,
  ConfigCreateInput,
  Container,
  ContainerChange,
  ContainerCreateInput,
  ContainerInspect,
  ContainerProcess,
  ContainerStats,
  ContainerUpdateInput,
  ExecConfig,
  ExecInspect,
  HubBuildHistory,
  HubBuildSettings,
  HubRepository,
  HubTag,
  HubWebhook,
  HubWebhookCreateInput,
  Image,
  ImageHistory,
  ImageInspect,
  ImagePruneResult,
  ImageSearchResult,
  Network,
  NetworkConnectInput,
  NetworkCreateInput,
  NetworkDisconnectInput,
  NetworkPruneResult,
  NodeSpec,
  PaginatedResponse,
  Plugin,
  PluginPrivilegeRequest,
  Secret,
  SecretCreateInput,
  Service,
  ServiceSpec,
  SwarmInitInput,
  SwarmJoinInput,
  SwarmNode,
  SwarmSpec,
  SwarmUnlockKey,
  SystemDataUsage,
  SystemEvent,
  SystemInfo,
  SystemVersion,
  Task,
  Volume,
  VolumeCreateInput,
  VolumePruneResult,
} from './types/entities.js';

// Filter types - using Record for compatibility with encodeFilters
type Filters = Record<string, unknown[]>;
import type { TenantCredentials } from './types/env.js';
import {
  AuthenticationError,
  ConflictError,
  ConnectionError,
  NotFoundError,
  parseDockerError,
  RateLimitError,
  ValidationError,
} from './utils/errors.js';

// =============================================================================
// Configuration
// =============================================================================

const DOCKER_API_VERSION = 'v1.47';
const DOCKER_HUB_API_URL = 'https://hub.docker.com/v2';

// =============================================================================
// Docker Client Interface
// =============================================================================

export interface DockerClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // =========================================================================
  // Containers
  // =========================================================================
  listContainers(all?: boolean, filters?: Filters): Promise<Container[]>;
  inspectContainer(id: string): Promise<ContainerInspect>;
  createContainer(config: ContainerCreateInput): Promise<{ id: string; warnings: string[] }>;
  startContainer(id: string): Promise<void>;
  stopContainer(id: string, timeout?: number): Promise<void>;
  restartContainer(id: string, timeout?: number): Promise<void>;
  killContainer(id: string, signal?: string): Promise<void>;
  pauseContainer(id: string): Promise<void>;
  unpauseContainer(id: string): Promise<void>;
  removeContainer(id: string, force?: boolean, removeVolumes?: boolean): Promise<void>;
  renameContainer(id: string, name: string): Promise<void>;
  updateContainer(id: string, config: ContainerUpdateInput): Promise<{ warnings: string[] }>;
  getContainerLogs(id: string, tail?: number, timestamps?: boolean): Promise<string>;
  getContainerStats(id: string, stream?: boolean): Promise<ContainerStats>;
  getContainerTop(id: string, psArgs?: string): Promise<ContainerProcess>;
  getContainerChanges(id: string): Promise<ContainerChange[]>;
  waitContainer(id: string): Promise<{ statusCode: number; error?: { message: string } }>;
  pruneContainers(filters?: Filters): Promise<{ containersDeleted: string[]; spaceReclaimed: number }>;

  // =========================================================================
  // Images
  // =========================================================================
  listImages(all?: boolean, filters?: Filters): Promise<Image[]>;
  inspectImage(name: string): Promise<ImageInspect>;
  getImageHistory(name: string): Promise<ImageHistory[]>;
  pullImage(image: string, tag?: string, auth?: AuthConfig): Promise<string>;
  pushImage(name: string, tag?: string, auth?: AuthConfig): Promise<string>;
  tagImage(name: string, repo: string, tag?: string): Promise<void>;
  removeImage(name: string, force?: boolean, noPrune?: boolean): Promise<Array<{ untagged?: string; deleted?: string }>>;
  searchImages(term: string, limit?: number): Promise<ImageSearchResult[]>;
  pruneImages(dangling?: boolean, filters?: Filters): Promise<ImagePruneResult>;

  // =========================================================================
  // Networks
  // =========================================================================
  listNetworks(filters?: Filters): Promise<Network[]>;
  inspectNetwork(id: string): Promise<Network>;
  createNetwork(config: NetworkCreateInput): Promise<{ id: string; warning: string }>;
  removeNetwork(id: string): Promise<void>;
  connectNetwork(id: string, config: NetworkConnectInput): Promise<void>;
  disconnectNetwork(id: string, config: NetworkDisconnectInput): Promise<void>;
  pruneNetworks(filters?: Filters): Promise<NetworkPruneResult>;

  // =========================================================================
  // Volumes
  // =========================================================================
  listVolumes(filters?: Filters): Promise<{ volumes: Volume[]; warnings: string[] }>;
  inspectVolume(name: string): Promise<Volume>;
  createVolume(config?: VolumeCreateInput): Promise<Volume>;
  removeVolume(name: string, force?: boolean): Promise<void>;
  pruneVolumes(filters?: Filters): Promise<VolumePruneResult>;

  // =========================================================================
  // Exec
  // =========================================================================
  createExec(containerId: string, config: ExecConfig): Promise<{ id: string }>;
  startExec(id: string, detach?: boolean, tty?: boolean): Promise<string>;
  inspectExec(id: string): Promise<ExecInspect>;
  resizeExec(id: string, height: number, width: number): Promise<void>;

  // =========================================================================
  // System
  // =========================================================================
  getSystemInfo(): Promise<SystemInfo>;
  getVersion(): Promise<SystemVersion>;
  ping(): Promise<string>;
  getDataUsage(): Promise<SystemDataUsage>;
  getEvents(since?: number, until?: number, filters?: Record<string, string[]>): Promise<SystemEvent[]>;
  auth(config: AuthConfig): Promise<AuthResponse>;

  // =========================================================================
  // Swarm
  // =========================================================================
  inspectSwarm(): Promise<SwarmSpec>;
  initSwarm(config: SwarmInitInput): Promise<string>;
  joinSwarm(config: SwarmJoinInput): Promise<void>;
  leaveSwarm(force?: boolean): Promise<void>;
  updateSwarm(version: number, spec: SwarmSpec, rotateWorkerToken?: boolean, rotateManagerToken?: boolean): Promise<void>;
  getSwarmUnlockKey(): Promise<SwarmUnlockKey>;
  unlockSwarm(unlockKey: string): Promise<void>;

  // =========================================================================
  // Nodes
  // =========================================================================
  listNodes(filters?: Filters): Promise<SwarmNode[]>;
  inspectNode(id: string): Promise<SwarmNode>;
  removeNode(id: string, force?: boolean): Promise<void>;
  updateNode(id: string, version: number, spec: NodeSpec): Promise<void>;

  // =========================================================================
  // Services
  // =========================================================================
  listServices(filters?: Filters): Promise<Service[]>;
  inspectService(id: string): Promise<Service>;
  createService(spec: ServiceSpec, auth?: AuthConfig): Promise<{ id: string; warnings: string[] }>;
  updateService(id: string, version: number, spec: ServiceSpec, auth?: AuthConfig): Promise<{ warnings: string[] }>;
  removeService(id: string): Promise<void>;
  getServiceLogs(id: string, tail?: number, timestamps?: boolean): Promise<string>;

  // =========================================================================
  // Tasks
  // =========================================================================
  listTasks(filters?: Filters): Promise<Task[]>;
  inspectTask(id: string): Promise<Task>;
  getTaskLogs(id: string, tail?: number, timestamps?: boolean): Promise<string>;

  // =========================================================================
  // Secrets
  // =========================================================================
  listSecrets(filters?: Filters): Promise<Secret[]>;
  inspectSecret(id: string): Promise<Secret>;
  createSecret(config: SecretCreateInput): Promise<{ id: string }>;
  removeSecret(id: string): Promise<void>;
  updateSecret(id: string, version: number, spec: SecretCreateInput): Promise<void>;

  // =========================================================================
  // Configs
  // =========================================================================
  listConfigs(filters?: Filters): Promise<Config[]>;
  inspectConfig(id: string): Promise<Config>;
  createConfig(config: ConfigCreateInput): Promise<{ id: string }>;
  removeConfig(id: string): Promise<void>;
  updateConfig(id: string, version: number, spec: ConfigCreateInput): Promise<void>;

  // =========================================================================
  // Plugins
  // =========================================================================
  listPlugins(filters?: Filters): Promise<Plugin[]>;
  inspectPlugin(name: string): Promise<Plugin>;
  getPluginPrivileges(remote: string): Promise<PluginPrivilegeRequest[]>;
  installPlugin(remote: string, name?: string, privileges?: PluginPrivilegeRequest[]): Promise<void>;
  enablePlugin(name: string, timeout?: number): Promise<void>;
  disablePlugin(name: string, force?: boolean): Promise<void>;
  removePlugin(name: string, force?: boolean): Promise<void>;
  upgradePlugin(name: string, remote: string, privileges?: PluginPrivilegeRequest[]): Promise<void>;
  configurePlugin(name: string, body: string[]): Promise<void>;

  // =========================================================================
  // Docker Hub
  // =========================================================================
  hubLogin(username: string, password: string): Promise<string>;
  hubGetRepositories(namespace: string, page?: number, pageSize?: number): Promise<PaginatedResponse<HubRepository>>;
  hubGetRepository(namespace: string, repository: string): Promise<HubRepository>;
  hubGetTags(namespace: string, repository: string, page?: number, pageSize?: number): Promise<PaginatedResponse<HubTag>>;
  hubGetTag(namespace: string, repository: string, tag: string): Promise<HubTag>;
  hubDeleteTag(namespace: string, repository: string, tag: string): Promise<void>;
  hubGetWebhooks(namespace: string, repository: string): Promise<HubWebhook[]>;
  hubCreateWebhook(namespace: string, repository: string, config: HubWebhookCreateInput): Promise<HubWebhook>;
  hubDeleteWebhook(namespace: string, repository: string, webhookId: number): Promise<void>;
  hubGetBuildSettings(namespace: string, repository: string): Promise<HubBuildSettings>;
  hubGetBuildHistory(namespace: string, repository: string, page?: number, pageSize?: number): Promise<PaginatedResponse<HubBuildHistory>>;
  hubTriggerBuild(namespace: string, repository: string, sourceType?: string, sourceName?: string): Promise<void>;
}

// =============================================================================
// Docker Client Implementation
// =============================================================================

class DockerClientImpl implements DockerClient {
  private credentials: TenantCredentials;
  private dockerBaseUrl: string;
  private hubToken?: string;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    // Convert docker host to HTTP URL
    // Docker host format: tcp://host:2375 or unix:///var/run/docker.sock
    // For Cloudflare Workers, we can only use TCP
    this.dockerBaseUrl = this.parseDockerHost(credentials.dockerHost || '');
  }

  private parseDockerHost(host: string): string {
    if (!host) return '';
    if (host.startsWith('tcp://')) {
      return `http://${host.slice(6)}`;
    }
    if (host.startsWith('http://') || host.startsWith('https://')) {
      return host;
    }
    return `http://${host}`;
  }

  // ===========================================================================
  // HTTP Request Helpers
  // ===========================================================================

  private async dockerRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.dockerBaseUrl) {
      throw new ConnectionError('Docker host not configured. Provide X-Docker-Host header.');
    }

    const version = this.credentials.apiVersion || DOCKER_API_VERSION;
    const url = `${this.dockerBaseUrl}/${version}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw parseDockerError(response.status, errorBody);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>;
      }

      return response.text() as unknown as T;
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ConflictError ||
        error instanceof RateLimitError ||
        error instanceof ConnectionError
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConnectionError(`Failed to connect to Docker: ${error.message}`);
      }
      throw new ConnectionError('Failed to connect to Docker daemon');
    }
  }

  private async hubRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth = false
  ): Promise<T> {
    const url = `${DOCKER_HUB_API_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.hubToken) {
      headers.Authorization = `Bearer ${this.hubToken}`;
    } else if (this.credentials.hubToken) {
      headers.Authorization = `Bearer ${this.credentials.hubToken}`;
    } else if (requireAuth) {
      throw new AuthenticationError('Docker Hub authentication required. Provide X-Docker-Hub-Token header or login first.');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError('Docker Hub rate limit exceeded', retryAfter ? Number.parseInt(retryAfter, 10) : 60);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError('Docker Hub authentication failed. Check your credentials.');
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw parseDockerError(response.status, errorBody);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof NotFoundError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConnectionError(`Failed to connect to Docker Hub: ${error.message}`);
      }
      throw new ConnectionError('Failed to connect to Docker Hub');
    }
  }

  private encodeFilters(filters: Record<string, unknown>): string {
    return encodeURIComponent(JSON.stringify(filters));
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.ping();
      return { connected: true, message: 'Successfully connected to Docker daemon' };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // Containers
  // ===========================================================================

  async listContainers(all = false, filters?: Filters): Promise<Container[]> {
    let endpoint = `/containers/json?all=${all}`;
    if (filters) {
      endpoint += `&filters=${this.encodeFilters(filters)}`;
    }
    const containers = await this.dockerRequest<Array<Record<string, unknown>>>(endpoint);
    return containers.map((c) => this.mapContainer(c));
  }

  async inspectContainer(id: string): Promise<ContainerInspect> {
    return this.dockerRequest<ContainerInspect>(`/containers/${id}/json`);
  }

  async createContainer(config: ContainerCreateInput): Promise<{ id: string; warnings: string[] }> {
    let endpoint = '/containers/create';
    if (config.name) {
      endpoint += `?name=${encodeURIComponent(config.name)}`;
    }
    const { name: _, ...body } = config;
    return this.dockerRequest<{ Id: string; Warnings: string[] }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(this.mapContainerCreateInput(body)),
    }).then((r) => ({ id: r.Id, warnings: r.Warnings || [] }));
  }

  async startContainer(id: string): Promise<void> {
    await this.dockerRequest(`/containers/${id}/start`, { method: 'POST' });
  }

  async stopContainer(id: string, timeout = 10): Promise<void> {
    await this.dockerRequest(`/containers/${id}/stop?t=${timeout}`, { method: 'POST' });
  }

  async restartContainer(id: string, timeout = 10): Promise<void> {
    await this.dockerRequest(`/containers/${id}/restart?t=${timeout}`, { method: 'POST' });
  }

  async killContainer(id: string, signal = 'SIGKILL'): Promise<void> {
    await this.dockerRequest(`/containers/${id}/kill?signal=${signal}`, { method: 'POST' });
  }

  async pauseContainer(id: string): Promise<void> {
    await this.dockerRequest(`/containers/${id}/pause`, { method: 'POST' });
  }

  async unpauseContainer(id: string): Promise<void> {
    await this.dockerRequest(`/containers/${id}/unpause`, { method: 'POST' });
  }

  async removeContainer(id: string, force = false, removeVolumes = false): Promise<void> {
    await this.dockerRequest(`/containers/${id}?force=${force}&v=${removeVolumes}`, { method: 'DELETE' });
  }

  async renameContainer(id: string, name: string): Promise<void> {
    await this.dockerRequest(`/containers/${id}/rename?name=${encodeURIComponent(name)}`, { method: 'POST' });
  }

  async updateContainer(id: string, config: ContainerUpdateInput): Promise<{ warnings: string[] }> {
    return this.dockerRequest<{ Warnings: string[] }>(`/containers/${id}/update`, {
      method: 'POST',
      body: JSON.stringify(config),
    }).then((r) => ({ warnings: r.Warnings || [] }));
  }

  async getContainerLogs(id: string, tail = 100, timestamps = false): Promise<string> {
    return this.dockerRequest<string>(
      `/containers/${id}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=${timestamps}`
    );
  }

  async getContainerStats(id: string, stream = false): Promise<ContainerStats> {
    return this.dockerRequest<ContainerStats>(`/containers/${id}/stats?stream=${stream}`);
  }

  async getContainerTop(id: string, psArgs = '-ef'): Promise<ContainerProcess> {
    const result = await this.dockerRequest<{ Titles: string[]; Processes: string[][] }>(
      `/containers/${id}/top?ps_args=${encodeURIComponent(psArgs)}`
    );
    return { titles: result.Titles, processes: result.Processes };
  }

  async getContainerChanges(id: string): Promise<ContainerChange[]> {
    const result = await this.dockerRequest<Array<{ Path: string; Kind: 0 | 1 | 2 }>>(
      `/containers/${id}/changes`
    );
    return result?.map((c) => ({ path: c.Path, kind: c.Kind })) || [];
  }

  async waitContainer(id: string): Promise<{ statusCode: number; error?: { message: string } }> {
    const result = await this.dockerRequest<{ StatusCode: number; Error?: { Message: string } }>(
      `/containers/${id}/wait`,
      { method: 'POST' }
    );
    return {
      statusCode: result.StatusCode,
      error: result.Error ? { message: result.Error.Message } : undefined,
    };
  }

  async pruneContainers(filters?: Filters): Promise<{ containersDeleted: string[]; spaceReclaimed: number }> {
    let endpoint = '/containers/prune';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    const result = await this.dockerRequest<{ ContainersDeleted: string[]; SpaceReclaimed: number }>(
      endpoint,
      { method: 'POST' }
    );
    return {
      containersDeleted: result.ContainersDeleted || [],
      spaceReclaimed: result.SpaceReclaimed || 0,
    };
  }

  // ===========================================================================
  // Images
  // ===========================================================================

  async listImages(all = false, filters?: Filters): Promise<Image[]> {
    let endpoint = `/images/json?all=${all}`;
    if (filters) {
      endpoint += `&filters=${this.encodeFilters(filters)}`;
    }
    const images = await this.dockerRequest<Array<Record<string, unknown>>>(endpoint);
    return images.map((i) => this.mapImage(i));
  }

  async inspectImage(name: string): Promise<ImageInspect> {
    return this.dockerRequest<ImageInspect>(`/images/${encodeURIComponent(name)}/json`);
  }

  async getImageHistory(name: string): Promise<ImageHistory[]> {
    const result = await this.dockerRequest<Array<Record<string, unknown>>>(
      `/images/${encodeURIComponent(name)}/history`
    );
    return result.map((h) => ({
      id: h.Id as string,
      created: h.Created as number,
      createdBy: h.CreatedBy as string,
      tags: (h.Tags as string[]) || [],
      size: h.Size as number,
      comment: h.Comment as string,
    }));
  }

  async pullImage(image: string, tag = 'latest', auth?: AuthConfig): Promise<string> {
    const headers: Record<string, string> = {};
    if (auth) {
      headers['X-Registry-Auth'] = btoa(JSON.stringify(auth));
    }
    return this.dockerRequest<string>(
      `/images/create?fromImage=${encodeURIComponent(image)}&tag=${encodeURIComponent(tag)}`,
      { method: 'POST', headers }
    );
  }

  async pushImage(name: string, tag?: string, auth?: AuthConfig): Promise<string> {
    let endpoint = `/images/${encodeURIComponent(name)}/push`;
    if (tag) {
      endpoint += `?tag=${encodeURIComponent(tag)}`;
    }
    const headers: Record<string, string> = {};
    if (auth) {
      headers['X-Registry-Auth'] = btoa(JSON.stringify(auth));
    }
    return this.dockerRequest<string>(endpoint, { method: 'POST', headers });
  }

  async tagImage(name: string, repo: string, tag = 'latest'): Promise<void> {
    await this.dockerRequest(
      `/images/${encodeURIComponent(name)}/tag?repo=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`,
      { method: 'POST' }
    );
  }

  async removeImage(name: string, force = false, noPrune = false): Promise<Array<{ untagged?: string; deleted?: string }>> {
    const result = await this.dockerRequest<Array<{ Untagged?: string; Deleted?: string }>>(
      `/images/${encodeURIComponent(name)}?force=${force}&noprune=${noPrune}`,
      { method: 'DELETE' }
    );
    return result?.map((r) => ({ untagged: r.Untagged, deleted: r.Deleted })) || [];
  }

  async searchImages(term: string, limit = 25): Promise<ImageSearchResult[]> {
    const result = await this.dockerRequest<Array<Record<string, unknown>>>(
      `/images/search?term=${encodeURIComponent(term)}&limit=${limit}`
    );
    return result.map((r) => ({
      description: r.description as string,
      isOfficial: r.is_official as boolean,
      isAutomated: r.is_automated as boolean,
      name: r.name as string,
      starCount: r.star_count as number,
    }));
  }

  async pruneImages(dangling = true, filters?: Filters): Promise<ImagePruneResult> {
    let endpoint = '/images/prune';
    const allFilters = { ...filters, dangling: [String(dangling)] };
    endpoint += `?filters=${this.encodeFilters(allFilters)}`;
    const result = await this.dockerRequest<{ ImagesDeleted: Array<{ Untagged?: string; Deleted?: string }>; SpaceReclaimed: number }>(
      endpoint,
      { method: 'POST' }
    );
    return {
      imagesDeleted: result.ImagesDeleted?.map((i) => ({ untagged: i.Untagged, deleted: i.Deleted })) || [],
      spaceReclaimed: result.SpaceReclaimed || 0,
    };
  }

  // ===========================================================================
  // Networks
  // ===========================================================================

  async listNetworks(filters?: Filters): Promise<Network[]> {
    let endpoint = '/networks';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    const networks = await this.dockerRequest<Array<Record<string, unknown>>>(endpoint);
    return networks.map((n) => this.mapNetwork(n));
  }

  async inspectNetwork(id: string): Promise<Network> {
    const result = await this.dockerRequest<Record<string, unknown>>(`/networks/${id}`);
    return this.mapNetwork(result);
  }

  async createNetwork(config: NetworkCreateInput): Promise<{ id: string; warning: string }> {
    const result = await this.dockerRequest<{ Id: string; Warning: string }>('/networks/create', {
      method: 'POST',
      body: JSON.stringify({
        Name: config.name,
        CheckDuplicate: config.checkDuplicate,
        Driver: config.driver,
        Internal: config.internal,
        Attachable: config.attachable,
        Ingress: config.ingress,
        IPAM: config.ipam,
        EnableIPv6: config.enableIPv6,
        Options: config.options,
        Labels: config.labels,
      }),
    });
    return { id: result.Id, warning: result.Warning };
  }

  async removeNetwork(id: string): Promise<void> {
    await this.dockerRequest(`/networks/${id}`, { method: 'DELETE' });
  }

  async connectNetwork(id: string, config: NetworkConnectInput): Promise<void> {
    await this.dockerRequest(`/networks/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify({
        Container: config.container,
        EndpointConfig: config.endpointConfig,
      }),
    });
  }

  async disconnectNetwork(id: string, config: NetworkDisconnectInput): Promise<void> {
    await this.dockerRequest(`/networks/${id}/disconnect`, {
      method: 'POST',
      body: JSON.stringify({
        Container: config.container,
        Force: config.force,
      }),
    });
  }

  async pruneNetworks(filters?: Filters): Promise<NetworkPruneResult> {
    let endpoint = '/networks/prune';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    const result = await this.dockerRequest<{ NetworksDeleted: string[] }>(endpoint, { method: 'POST' });
    return { networksDeleted: result.NetworksDeleted || [] };
  }

  // ===========================================================================
  // Volumes
  // ===========================================================================

  async listVolumes(filters?: Filters): Promise<{ volumes: Volume[]; warnings: string[] }> {
    let endpoint = '/volumes';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    const result = await this.dockerRequest<{ Volumes: Array<Record<string, unknown>>; Warnings: string[] }>(endpoint);
    return {
      volumes: result.Volumes?.map((v) => this.mapVolume(v)) || [],
      warnings: result.Warnings || [],
    };
  }

  async inspectVolume(name: string): Promise<Volume> {
    const result = await this.dockerRequest<Record<string, unknown>>(`/volumes/${encodeURIComponent(name)}`);
    return this.mapVolume(result);
  }

  async createVolume(config?: VolumeCreateInput): Promise<Volume> {
    const result = await this.dockerRequest<Record<string, unknown>>('/volumes/create', {
      method: 'POST',
      body: JSON.stringify({
        Name: config?.name,
        Driver: config?.driver,
        DriverOpts: config?.driverOpts,
        Labels: config?.labels,
      }),
    });
    return this.mapVolume(result);
  }

  async removeVolume(name: string, force = false): Promise<void> {
    await this.dockerRequest(`/volumes/${encodeURIComponent(name)}?force=${force}`, { method: 'DELETE' });
  }

  async pruneVolumes(filters?: Filters): Promise<VolumePruneResult> {
    let endpoint = '/volumes/prune';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    const result = await this.dockerRequest<{ VolumesDeleted: string[]; SpaceReclaimed: number }>(
      endpoint,
      { method: 'POST' }
    );
    return {
      volumesDeleted: result.VolumesDeleted || [],
      spaceReclaimed: result.SpaceReclaimed || 0,
    };
  }

  // ===========================================================================
  // Exec
  // ===========================================================================

  async createExec(containerId: string, config: ExecConfig): Promise<{ id: string }> {
    const result = await this.dockerRequest<{ Id: string }>(`/containers/${containerId}/exec`, {
      method: 'POST',
      body: JSON.stringify({
        AttachStdin: config.attachStdin,
        AttachStdout: config.attachStdout,
        AttachStderr: config.attachStderr,
        DetachKeys: config.detachKeys,
        Tty: config.tty,
        Env: config.env,
        Cmd: config.cmd,
        Privileged: config.privileged,
        User: config.user,
        WorkingDir: config.workingDir,
      }),
    });
    return { id: result.Id };
  }

  async startExec(id: string, detach = false, tty = false): Promise<string> {
    return this.dockerRequest<string>(`/exec/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ Detach: detach, Tty: tty }),
    });
  }

  async inspectExec(id: string): Promise<ExecInspect> {
    const result = await this.dockerRequest<Record<string, unknown>>(`/exec/${id}/json`);
    return {
      canRemove: result.CanRemove as boolean,
      detachKeys: result.DetachKeys as string,
      id: result.ID as string,
      running: result.Running as boolean,
      exitCode: result.ExitCode as number | undefined,
      processConfig: {
        privileged: (result.ProcessConfig as Record<string, unknown>)?.privileged as boolean,
        user: (result.ProcessConfig as Record<string, unknown>)?.user as string,
        tty: (result.ProcessConfig as Record<string, unknown>)?.tty as boolean,
        entrypoint: (result.ProcessConfig as Record<string, unknown>)?.entrypoint as string,
        arguments: (result.ProcessConfig as Record<string, unknown>)?.arguments as string[],
      },
      openStdin: result.OpenStdin as boolean,
      openStderr: result.OpenStderr as boolean,
      openStdout: result.OpenStdout as boolean,
      containerID: result.ContainerID as string,
      pid: result.Pid as number,
    };
  }

  async resizeExec(id: string, height: number, width: number): Promise<void> {
    await this.dockerRequest(`/exec/${id}/resize?h=${height}&w=${width}`, { method: 'POST' });
  }

  // ===========================================================================
  // System
  // ===========================================================================

  async getSystemInfo(): Promise<SystemInfo> {
    return this.dockerRequest<SystemInfo>('/info');
  }

  async getVersion(): Promise<SystemVersion> {
    return this.dockerRequest<SystemVersion>('/version');
  }

  async ping(): Promise<string> {
    return this.dockerRequest<string>('/_ping');
  }

  async getDataUsage(): Promise<SystemDataUsage> {
    return this.dockerRequest<SystemDataUsage>('/system/df');
  }

  async getEvents(since?: number, until?: number, filters?: Record<string, string[]>): Promise<SystemEvent[]> {
    let endpoint = '/events?';
    if (since) endpoint += `since=${since}&`;
    if (until) endpoint += `until=${until}&`;
    if (filters) endpoint += `filters=${this.encodeFilters(filters)}`;
    return this.dockerRequest<SystemEvent[]>(endpoint);
  }

  async auth(config: AuthConfig): Promise<AuthResponse> {
    return this.dockerRequest<AuthResponse>('/auth', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // ===========================================================================
  // Swarm
  // ===========================================================================

  async inspectSwarm(): Promise<SwarmSpec> {
    return this.dockerRequest<SwarmSpec>('/swarm');
  }

  async initSwarm(config: SwarmInitInput): Promise<string> {
    return this.dockerRequest<string>('/swarm/init', {
      method: 'POST',
      body: JSON.stringify({
        ListenAddr: config.listenAddr,
        AdvertiseAddr: config.advertiseAddr,
        DataPathAddr: config.dataPathAddr,
        DataPathPort: config.dataPathPort,
        DefaultAddrPool: config.defaultAddrPool,
        ForceNewCluster: config.forceNewCluster,
        SubnetSize: config.subnetSize,
        Spec: config.spec,
      }),
    });
  }

  async joinSwarm(config: SwarmJoinInput): Promise<void> {
    await this.dockerRequest('/swarm/join', {
      method: 'POST',
      body: JSON.stringify({
        ListenAddr: config.listenAddr,
        AdvertiseAddr: config.advertiseAddr,
        DataPathAddr: config.dataPathAddr,
        RemoteAddrs: config.remoteAddrs,
        JoinToken: config.joinToken,
      }),
    });
  }

  async leaveSwarm(force = false): Promise<void> {
    await this.dockerRequest(`/swarm/leave?force=${force}`, { method: 'POST' });
  }

  async updateSwarm(
    version: number,
    spec: SwarmSpec,
    rotateWorkerToken = false,
    rotateManagerToken = false
  ): Promise<void> {
    await this.dockerRequest(
      `/swarm/update?version=${version}&rotateWorkerToken=${rotateWorkerToken}&rotateManagerToken=${rotateManagerToken}`,
      { method: 'POST', body: JSON.stringify(spec) }
    );
  }

  async getSwarmUnlockKey(): Promise<SwarmUnlockKey> {
    const result = await this.dockerRequest<{ UnlockKey: string }>('/swarm/unlockkey');
    return { unlockKey: result.UnlockKey };
  }

  async unlockSwarm(unlockKey: string): Promise<void> {
    await this.dockerRequest('/swarm/unlock', {
      method: 'POST',
      body: JSON.stringify({ UnlockKey: unlockKey }),
    });
  }

  // ===========================================================================
  // Nodes
  // ===========================================================================

  async listNodes(filters?: Filters): Promise<SwarmNode[]> {
    let endpoint = '/nodes';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    return this.dockerRequest<SwarmNode[]>(endpoint);
  }

  async inspectNode(id: string): Promise<SwarmNode> {
    return this.dockerRequest<SwarmNode>(`/nodes/${id}`);
  }

  async removeNode(id: string, force = false): Promise<void> {
    await this.dockerRequest(`/nodes/${id}?force=${force}`, { method: 'DELETE' });
  }

  async updateNode(id: string, version: number, spec: NodeSpec): Promise<void> {
    await this.dockerRequest(`/nodes/${id}/update?version=${version}`, {
      method: 'POST',
      body: JSON.stringify(spec),
    });
  }

  // ===========================================================================
  // Services
  // ===========================================================================

  async listServices(filters?: Filters): Promise<Service[]> {
    let endpoint = '/services';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    return this.dockerRequest<Service[]>(endpoint);
  }

  async inspectService(id: string): Promise<Service> {
    return this.dockerRequest<Service>(`/services/${id}`);
  }

  async createService(spec: ServiceSpec, auth?: AuthConfig): Promise<{ id: string; warnings: string[] }> {
    const headers: Record<string, string> = {};
    if (auth) {
      headers['X-Registry-Auth'] = btoa(JSON.stringify(auth));
    }
    const result = await this.dockerRequest<{ ID: string; Warnings: string[] }>('/services/create', {
      method: 'POST',
      body: JSON.stringify(spec),
      headers,
    });
    return { id: result.ID, warnings: result.Warnings || [] };
  }

  async updateService(id: string, version: number, spec: ServiceSpec, auth?: AuthConfig): Promise<{ warnings: string[] }> {
    const headers: Record<string, string> = {};
    if (auth) {
      headers['X-Registry-Auth'] = btoa(JSON.stringify(auth));
    }
    const result = await this.dockerRequest<{ Warnings: string[] }>(`/services/${id}/update?version=${version}`, {
      method: 'POST',
      body: JSON.stringify(spec),
      headers,
    });
    return { warnings: result.Warnings || [] };
  }

  async removeService(id: string): Promise<void> {
    await this.dockerRequest(`/services/${id}`, { method: 'DELETE' });
  }

  async getServiceLogs(id: string, tail = 100, timestamps = false): Promise<string> {
    return this.dockerRequest<string>(
      `/services/${id}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=${timestamps}`
    );
  }

  // ===========================================================================
  // Tasks
  // ===========================================================================

  async listTasks(filters?: Filters): Promise<Task[]> {
    let endpoint = '/tasks';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    return this.dockerRequest<Task[]>(endpoint);
  }

  async inspectTask(id: string): Promise<Task> {
    return this.dockerRequest<Task>(`/tasks/${id}`);
  }

  async getTaskLogs(id: string, tail = 100, timestamps = false): Promise<string> {
    return this.dockerRequest<string>(
      `/tasks/${id}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=${timestamps}`
    );
  }

  // ===========================================================================
  // Secrets
  // ===========================================================================

  async listSecrets(filters?: Filters): Promise<Secret[]> {
    let endpoint = '/secrets';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    return this.dockerRequest<Secret[]>(endpoint);
  }

  async inspectSecret(id: string): Promise<Secret> {
    return this.dockerRequest<Secret>(`/secrets/${id}`);
  }

  async createSecret(config: SecretCreateInput): Promise<{ id: string }> {
    const result = await this.dockerRequest<{ ID: string }>('/secrets/create', {
      method: 'POST',
      body: JSON.stringify({
        Name: config.name,
        Labels: config.labels,
        Data: config.data,
        Driver: config.driver,
        Templating: config.templating,
      }),
    });
    return { id: result.ID };
  }

  async removeSecret(id: string): Promise<void> {
    await this.dockerRequest(`/secrets/${id}`, { method: 'DELETE' });
  }

  async updateSecret(id: string, version: number, spec: SecretCreateInput): Promise<void> {
    await this.dockerRequest(`/secrets/${id}/update?version=${version}`, {
      method: 'POST',
      body: JSON.stringify(spec),
    });
  }

  // ===========================================================================
  // Configs
  // ===========================================================================

  async listConfigs(filters?: Filters): Promise<Config[]> {
    let endpoint = '/configs';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    return this.dockerRequest<Config[]>(endpoint);
  }

  async inspectConfig(id: string): Promise<Config> {
    return this.dockerRequest<Config>(`/configs/${id}`);
  }

  async createConfig(config: ConfigCreateInput): Promise<{ id: string }> {
    const result = await this.dockerRequest<{ ID: string }>('/configs/create', {
      method: 'POST',
      body: JSON.stringify({
        Name: config.name,
        Labels: config.labels,
        Data: config.data,
        Templating: config.templating,
      }),
    });
    return { id: result.ID };
  }

  async removeConfig(id: string): Promise<void> {
    await this.dockerRequest(`/configs/${id}`, { method: 'DELETE' });
  }

  async updateConfig(id: string, version: number, spec: ConfigCreateInput): Promise<void> {
    await this.dockerRequest(`/configs/${id}/update?version=${version}`, {
      method: 'POST',
      body: JSON.stringify(spec),
    });
  }

  // ===========================================================================
  // Plugins
  // ===========================================================================

  async listPlugins(filters?: Filters): Promise<Plugin[]> {
    let endpoint = '/plugins';
    if (filters) {
      endpoint += `?filters=${this.encodeFilters(filters)}`;
    }
    return this.dockerRequest<Plugin[]>(endpoint);
  }

  async inspectPlugin(name: string): Promise<Plugin> {
    return this.dockerRequest<Plugin>(`/plugins/${encodeURIComponent(name)}/json`);
  }

  async getPluginPrivileges(remote: string): Promise<PluginPrivilegeRequest[]> {
    return this.dockerRequest<PluginPrivilegeRequest[]>(
      `/plugins/privileges?remote=${encodeURIComponent(remote)}`
    );
  }

  async installPlugin(
    remote: string,
    name?: string,
    privileges?: PluginPrivilegeRequest[]
  ): Promise<void> {
    let endpoint = `/plugins/pull?remote=${encodeURIComponent(remote)}`;
    if (name) {
      endpoint += `&name=${encodeURIComponent(name)}`;
    }
    await this.dockerRequest(endpoint, {
      method: 'POST',
      body: privileges ? JSON.stringify(privileges) : undefined,
    });
  }

  async enablePlugin(name: string, timeout = 0): Promise<void> {
    await this.dockerRequest(`/plugins/${encodeURIComponent(name)}/enable?timeout=${timeout}`, { method: 'POST' });
  }

  async disablePlugin(name: string, force = false): Promise<void> {
    await this.dockerRequest(`/plugins/${encodeURIComponent(name)}/disable?force=${force}`, { method: 'POST' });
  }

  async removePlugin(name: string, force = false): Promise<void> {
    await this.dockerRequest(`/plugins/${encodeURIComponent(name)}?force=${force}`, { method: 'DELETE' });
  }

  async upgradePlugin(
    name: string,
    remote: string,
    privileges?: PluginPrivilegeRequest[]
  ): Promise<void> {
    await this.dockerRequest(
      `/plugins/${encodeURIComponent(name)}/upgrade?remote=${encodeURIComponent(remote)}`,
      {
        method: 'POST',
        body: privileges ? JSON.stringify(privileges) : undefined,
      }
    );
  }

  async configurePlugin(name: string, body: string[]): Promise<void> {
    await this.dockerRequest(`/plugins/${encodeURIComponent(name)}/set`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ===========================================================================
  // Docker Hub
  // ===========================================================================

  async hubLogin(username: string, password: string): Promise<string> {
    const result = await this.hubRequest<{ token: string }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.hubToken = result.token;
    return result.token;
  }

  async hubGetRepositories(
    namespace: string,
    page = 1,
    pageSize = 25
  ): Promise<PaginatedResponse<HubRepository>> {
    const result = await this.hubRequest<{
      count: number;
      next: string | null;
      results: Array<Record<string, unknown>>;
    }>(`/repositories/${namespace}/?page=${page}&page_size=${pageSize}`);

    return {
      items: result.results.map((r) => this.mapHubRepository(r)),
      count: result.results.length,
      total: result.count,
      hasMore: !!result.next,
      nextCursor: result.next ? String(page + 1) : undefined,
    };
  }

  async hubGetRepository(namespace: string, repository: string): Promise<HubRepository> {
    const result = await this.hubRequest<Record<string, unknown>>(
      `/repositories/${namespace}/${repository}/`
    );
    return this.mapHubRepository(result);
  }

  async hubGetTags(
    namespace: string,
    repository: string,
    page = 1,
    pageSize = 25
  ): Promise<PaginatedResponse<HubTag>> {
    const result = await this.hubRequest<{
      count: number;
      next: string | null;
      results: Array<Record<string, unknown>>;
    }>(`/repositories/${namespace}/${repository}/tags/?page=${page}&page_size=${pageSize}`);

    return {
      items: result.results.map((t) => this.mapHubTag(t)),
      count: result.results.length,
      total: result.count,
      hasMore: !!result.next,
      nextCursor: result.next ? String(page + 1) : undefined,
    };
  }

  async hubGetTag(namespace: string, repository: string, tag: string): Promise<HubTag> {
    const result = await this.hubRequest<Record<string, unknown>>(
      `/repositories/${namespace}/${repository}/tags/${tag}/`
    );
    return this.mapHubTag(result);
  }

  async hubDeleteTag(namespace: string, repository: string, tag: string): Promise<void> {
    await this.hubRequest(
      `/repositories/${namespace}/${repository}/tags/${tag}/`,
      { method: 'DELETE' },
      true
    );
  }

  async hubGetWebhooks(namespace: string, repository: string): Promise<HubWebhook[]> {
    const result = await this.hubRequest<{ results: HubWebhook[] }>(
      `/repositories/${namespace}/${repository}/webhooks/`,
      {},
      true
    );
    return result.results;
  }

  async hubCreateWebhook(
    namespace: string,
    repository: string,
    config: HubWebhookCreateInput
  ): Promise<HubWebhook> {
    return this.hubRequest<HubWebhook>(
      `/repositories/${namespace}/${repository}/webhooks/`,
      {
        method: 'POST',
        body: JSON.stringify(config),
      },
      true
    );
  }

  async hubDeleteWebhook(namespace: string, repository: string, webhookId: number): Promise<void> {
    await this.hubRequest(
      `/repositories/${namespace}/${repository}/webhooks/${webhookId}/`,
      { method: 'DELETE' },
      true
    );
  }

  async hubGetBuildSettings(namespace: string, repository: string): Promise<HubBuildSettings> {
    return this.hubRequest<HubBuildSettings>(
      `/repositories/${namespace}/${repository}/autobuild/`,
      {},
      true
    );
  }

  async hubGetBuildHistory(
    namespace: string,
    repository: string,
    page = 1,
    pageSize = 25
  ): Promise<PaginatedResponse<HubBuildHistory>> {
    const result = await this.hubRequest<{
      count: number;
      next: string | null;
      results: HubBuildHistory[];
    }>(
      `/repositories/${namespace}/${repository}/buildhistory/?page=${page}&page_size=${pageSize}`,
      {},
      true
    );

    return {
      items: result.results,
      count: result.results.length,
      total: result.count,
      hasMore: !!result.next,
      nextCursor: result.next ? String(page + 1) : undefined,
    };
  }

  async hubTriggerBuild(
    namespace: string,
    repository: string,
    sourceType = 'Branch',
    sourceName = 'main'
  ): Promise<void> {
    await this.hubRequest(
      `/repositories/${namespace}/${repository}/autobuild/trigger-build/`,
      {
        method: 'POST',
        body: JSON.stringify({ source_type: sourceType, source_name: sourceName }),
      },
      true
    );
  }

  // ===========================================================================
  // Mappers
  // ===========================================================================

  private mapContainer(c: Record<string, unknown>): Container {
    return {
      id: c.Id as string,
      names: (c.Names as string[]) || [],
      image: c.Image as string,
      imageId: c.ImageID as string,
      command: c.Command as string,
      created: c.Created as number,
      state: c.State as Container['state'],
      status: c.Status as string,
      ports: ((c.Ports as Array<Record<string, unknown>>) || []).map((p) => ({
        ip: p.IP as string | undefined,
        privatePort: p.PrivatePort as number,
        publicPort: p.PublicPort as number | undefined,
        type: p.Type as 'tcp' | 'udp' | 'sctp',
      })),
      labels: (c.Labels as Record<string, string>) || {},
      sizeRw: c.SizeRw as number | undefined,
      sizeRootFs: c.SizeRootFs as number | undefined,
      mounts: ((c.Mounts as Array<Record<string, unknown>>) || []).map((m) => ({
        type: m.Type as Mount['type'],
        name: m.Name as string | undefined,
        source: m.Source as string,
        destination: m.Destination as string,
        driver: m.Driver as string | undefined,
        mode: m.Mode as string,
        rw: m.RW as boolean,
        propagation: m.Propagation as string,
      })),
    };
  }

  private mapContainerCreateInput(config: Omit<ContainerCreateInput, 'name'>): Record<string, unknown> {
    return {
      Hostname: config.hostname,
      Domainname: config.domainname,
      User: config.user,
      AttachStdin: config.attachStdin,
      AttachStdout: config.attachStdout,
      AttachStderr: config.attachStderr,
      ExposedPorts: config.exposedPorts,
      Tty: config.tty,
      OpenStdin: config.openStdin,
      StdinOnce: config.stdinOnce,
      Env: config.env,
      Cmd: config.cmd,
      Healthcheck: config.healthcheck,
      ArgsEscaped: config.argsEscaped,
      Image: config.image,
      Volumes: config.volumes,
      WorkingDir: config.workingDir,
      Entrypoint: config.entrypoint,
      NetworkDisabled: config.networkDisabled,
      MacAddress: config.macAddress,
      Labels: config.labels,
      StopSignal: config.stopSignal,
      StopTimeout: config.stopTimeout,
      Shell: config.shell,
      HostConfig: config.hostConfig,
      NetworkingConfig: config.networkingConfig,
    };
  }

  private mapImage(i: Record<string, unknown>): Image {
    return {
      id: i.Id as string,
      parentId: i.ParentId as string,
      repoTags: (i.RepoTags as string[]) || [],
      repoDigests: (i.RepoDigests as string[]) || [],
      created: i.Created as number,
      size: i.Size as number,
      sharedSize: i.SharedSize as number,
      virtualSize: i.VirtualSize as number,
      labels: (i.Labels as Record<string, string>) || {},
      containers: i.Containers as number,
    };
  }

  private mapNetwork(n: Record<string, unknown>): Network {
    return {
      name: n.Name as string,
      id: n.Id as string,
      created: n.Created as string,
      scope: n.Scope as Network['scope'],
      driver: n.Driver as string,
      enableIPv6: n.EnableIPv6 as boolean,
      ipam: n.IPAM as Network['ipam'],
      internal: n.Internal as boolean,
      attachable: n.Attachable as boolean,
      ingress: n.Ingress as boolean,
      containers: (n.Containers as Record<string, Network['containers'][string]>) || {},
      options: (n.Options as Record<string, string>) || {},
      labels: (n.Labels as Record<string, string>) || {},
    };
  }

  private mapVolume(v: Record<string, unknown>): Volume {
    return {
      name: v.Name as string,
      driver: v.Driver as string,
      mountpoint: v.Mountpoint as string,
      createdAt: v.CreatedAt as string | undefined,
      status: v.Status as Record<string, string> | undefined,
      labels: (v.Labels as Record<string, string>) || {},
      scope: v.Scope as Volume['scope'],
      options: (v.Options as Record<string, string>) || {},
      usageData: v.UsageData as Volume['usageData'],
    };
  }

  private mapHubRepository(r: Record<string, unknown>): HubRepository {
    return {
      user: r.user as string,
      name: r.name as string,
      namespace: r.namespace as string,
      repositoryType: r.repository_type as 'image' | 'bundle',
      status: r.status as number,
      description: r.description as string,
      isPrivate: r.is_private as boolean,
      isAutomated: r.is_automated as boolean,
      canEdit: r.can_edit as boolean,
      starCount: r.star_count as number,
      pullCount: r.pull_count as number,
      lastUpdated: r.last_updated as string,
      isMigrated: r.is_migrated as boolean,
      collaboratorCount: r.collaborator_count as number,
      affiliation: r.affiliation as string | undefined,
      hubUser: r.hub_user as string,
    };
  }

  private mapHubTag(t: Record<string, unknown>): HubTag {
    return {
      creator: t.creator as number,
      id: t.id as number,
      imageId: t.image_id as string | undefined,
      images: ((t.images as Array<Record<string, unknown>>) || []).map((i) => ({
        architecture: i.architecture as string,
        features: i.features as string,
        variant: i.variant as string | undefined,
        digest: i.digest as string,
        os: i.os as string,
        osFeatures: i.os_features as string,
        osVersion: i.os_version as string | undefined,
        size: i.size as number,
        status: i.status as string,
        lastPulled: i.last_pulled as string | undefined,
        lastPushed: i.last_pushed as string,
      })),
      lastUpdated: t.last_updated as string,
      lastUpdater: t.last_updater as number,
      lastUpdaterUsername: t.last_updater_username as string,
      name: t.name as string,
      repository: t.repository as number,
      fullSize: t.full_size as number,
      v2: t.v2 as boolean,
      tagStatus: t.tag_status as 'active' | 'stale' | 'inactive',
      tagLastPushed: t.tag_last_pushed as string,
      tagLastPulled: t.tag_last_pulled as string | undefined,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Docker client instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides its own credentials via headers,
 * allowing a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createDockerClient(credentials: TenantCredentials): DockerClient {
  return new DockerClientImpl(credentials);
}

// Import for mappers
import type { Mount } from './types/entities.js';
