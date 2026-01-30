/**
 * Docker Entity Types
 *
 * Type definitions for Docker Engine API and Docker Hub API entities.
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Cursor for cursor-based pagination */
  cursor?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Number of items in this response */
  count: number;
  /** Total count (if available) */
  total?: number;
  /** Whether more items are available */
  hasMore: boolean;
  /** Next page cursor/number */
  nextCursor?: string;
}

// =============================================================================
// Container Types
// =============================================================================

export interface Container {
  id: string;
  names: string[];
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: ContainerState;
  status: string;
  ports: Port[];
  labels: Record<string, string>;
  sizeRw?: number;
  sizeRootFs?: number;
  networkSettings?: ContainerNetworkSettings;
  mounts: Mount[];
}

export type ContainerState =
  | 'created'
  | 'running'
  | 'paused'
  | 'restarting'
  | 'removing'
  | 'exited'
  | 'dead';

export interface Port {
  ip?: string;
  privatePort: number;
  publicPort?: number;
  type: 'tcp' | 'udp' | 'sctp';
}

export interface Mount {
  type: 'bind' | 'volume' | 'tmpfs' | 'npipe' | 'cluster';
  name?: string;
  source: string;
  destination: string;
  driver?: string;
  mode: string;
  rw: boolean;
  propagation: string;
}

export interface ContainerNetworkSettings {
  networks: Record<string, EndpointSettings>;
}

export interface EndpointSettings {
  ipamConfig?: {
    ipv4Address?: string;
    ipv6Address?: string;
    linkLocalIPs?: string[];
  };
  links?: string[];
  aliases?: string[];
  networkId: string;
  endpointId: string;
  gateway: string;
  ipAddress: string;
  ipPrefixLen: number;
  ipv6Gateway?: string;
  globalIPv6Address?: string;
  globalIPv6PrefixLen?: number;
  macAddress: string;
}

export interface ContainerInspect extends Container {
  created: number;
  path: string;
  args: string[];
  resolveConfPath: string;
  hostnamePath: string;
  hostsPath: string;
  logPath: string;
  name: string;
  restartCount: number;
  driver: string;
  platform: string;
  mountLabel: string;
  processLabel: string;
  appArmorProfile: string;
  execIds?: string[];
  hostConfig: HostConfig;
  graphDriver: GraphDriverData;
  config: ContainerConfig;
}

export interface ContainerConfig {
  hostname?: string;
  domainname?: string;
  user?: string;
  attachStdin?: boolean;
  attachStdout?: boolean;
  attachStderr?: boolean;
  exposedPorts?: Record<string, object>;
  tty?: boolean;
  openStdin?: boolean;
  stdinOnce?: boolean;
  env?: string[];
  cmd?: string[];
  healthcheck?: HealthConfig;
  argsEscaped?: boolean;
  image?: string;
  volumes?: Record<string, object>;
  workingDir?: string;
  entrypoint?: string[];
  networkDisabled?: boolean;
  macAddress?: string;
  onBuild?: string[];
  labels?: Record<string, string>;
  stopSignal?: string;
  stopTimeout?: number;
  shell?: string[];
}

export interface HealthConfig {
  test?: string[];
  interval?: number;
  timeout?: number;
  retries?: number;
  startPeriod?: number;
}

export interface HostConfig {
  cpuShares?: number;
  memory?: number;
  cgroupParent?: string;
  blkioWeight?: number;
  blkioWeightDevice?: WeightDevice[];
  blkioDeviceReadBps?: ThrottleDevice[];
  blkioDeviceWriteBps?: ThrottleDevice[];
  blkioDeviceReadIOps?: ThrottleDevice[];
  blkioDeviceWriteIOps?: ThrottleDevice[];
  cpuPeriod?: number;
  cpuQuota?: number;
  cpuRealtimePeriod?: number;
  cpuRealtimeRuntime?: number;
  cpusetCpus?: string;
  cpusetMems?: string;
  devices?: DeviceMapping[];
  deviceCgroupRules?: string[];
  deviceRequests?: DeviceRequest[];
  kernelMemory?: number;
  kernelMemoryTcp?: number;
  memoryReservation?: number;
  memorySwap?: number;
  memorySwappiness?: number;
  nanoCpus?: number;
  oomKillDisable?: boolean;
  init?: boolean;
  pidsLimit?: number;
  ulimits?: Ulimit[];
  cpuCount?: number;
  cpuPercent?: number;
  ioMaximumIOps?: number;
  ioMaximumBandwidth?: number;
  binds?: string[];
  containerIdFile?: string;
  logConfig?: LogConfig;
  networkMode?: string;
  portBindings?: Record<string, PortBinding[]>;
  restartPolicy?: RestartPolicy;
  autoRemove?: boolean;
  volumeDriver?: string;
  volumesFrom?: string[];
  mounts?: MountPoint[];
  capAdd?: string[];
  capDrop?: string[];
  cgroupnsMode?: 'private' | 'host';
  dns?: string[];
  dnsOptions?: string[];
  dnsSearch?: string[];
  extraHosts?: string[];
  groupAdd?: string[];
  ipcMode?: string;
  cgroup?: string;
  links?: string[];
  oomScoreAdj?: number;
  pidMode?: string;
  privileged?: boolean;
  publishAllPorts?: boolean;
  readonlyRootfs?: boolean;
  securityOpt?: string[];
  storageOpt?: Record<string, string>;
  tmpfs?: Record<string, string>;
  utsMode?: string;
  usernsMode?: string;
  shmSize?: number;
  sysctls?: Record<string, string>;
  runtime?: string;
  consoleSize?: [number, number];
  isolation?: 'default' | 'process' | 'hyperv';
  maskedPaths?: string[];
  readonlyPaths?: string[];
}

export interface WeightDevice {
  path: string;
  weight: number;
}

export interface ThrottleDevice {
  path: string;
  rate: number;
}

export interface DeviceMapping {
  pathOnHost: string;
  pathInContainer: string;
  cgroupPermissions: string;
}

export interface DeviceRequest {
  driver?: string;
  count?: number;
  deviceIds?: string[];
  capabilities?: string[][];
  options?: Record<string, string>;
}

export interface Ulimit {
  name: string;
  soft: number;
  hard: number;
}

export interface LogConfig {
  type: string;
  config?: Record<string, string>;
}

export interface PortBinding {
  hostIp?: string;
  hostPort: string;
}

export interface RestartPolicy {
  name: 'no' | 'always' | 'unless-stopped' | 'on-failure';
  maximumRetryCount?: number;
}

export interface MountPoint {
  target: string;
  source: string;
  type: 'bind' | 'volume' | 'tmpfs' | 'npipe' | 'cluster';
  readOnly?: boolean;
  consistency?: 'default' | 'consistent' | 'cached' | 'delegated';
  bindOptions?: {
    propagation?: 'private' | 'rprivate' | 'shared' | 'rshared' | 'slave' | 'rslave';
    nonRecursive?: boolean;
  };
  volumeOptions?: {
    noCopy?: boolean;
    labels?: Record<string, string>;
    driverConfig?: {
      name?: string;
      options?: Record<string, string>;
    };
  };
  tmpfsOptions?: {
    sizeBytes?: number;
    mode?: number;
  };
}

export interface GraphDriverData {
  name: string;
  data: Record<string, string>;
}

export interface ContainerCreateInput {
  image: string;
  name?: string;
  hostname?: string;
  domainname?: string;
  user?: string;
  attachStdin?: boolean;
  attachStdout?: boolean;
  attachStderr?: boolean;
  exposedPorts?: Record<string, object>;
  tty?: boolean;
  openStdin?: boolean;
  stdinOnce?: boolean;
  env?: string[];
  cmd?: string[];
  healthcheck?: HealthConfig;
  argsEscaped?: boolean;
  volumes?: Record<string, object>;
  workingDir?: string;
  entrypoint?: string[];
  networkDisabled?: boolean;
  macAddress?: string;
  labels?: Record<string, string>;
  stopSignal?: string;
  stopTimeout?: number;
  shell?: string[];
  hostConfig?: HostConfig;
  networkingConfig?: {
    endpointsConfig?: Record<string, EndpointSettings>;
  };
}

export interface ContainerUpdateInput {
  cpuShares?: number;
  memory?: number;
  cgroupParent?: string;
  blkioWeight?: number;
  cpuPeriod?: number;
  cpuQuota?: number;
  cpuRealtimePeriod?: number;
  cpuRealtimeRuntime?: number;
  cpusetCpus?: string;
  cpusetMems?: string;
  kernelMemory?: number;
  memoryReservation?: number;
  memorySwap?: number;
  restartPolicy?: RestartPolicy;
  nanoCpus?: number;
  pidsLimit?: number;
}

export interface ContainerStats {
  read: string;
  preread: string;
  pidsStats: { current: number; limit: number };
  blkioStats: {
    ioServiceBytesRecursive: Array<{ major: number; minor: number; op: string; value: number }>;
    ioServicedRecursive: Array<{ major: number; minor: number; op: string; value: number }>;
  };
  numProcs: number;
  storageStats: Record<string, unknown>;
  cpuStats: CpuStats;
  precpuStats: CpuStats;
  memoryStats: MemoryStats;
  networks?: Record<string, NetworkStats>;
}

export interface CpuStats {
  cpuUsage: {
    totalUsage: number;
    percpuUsage?: number[];
    usageInKernelmode: number;
    usageInUsermode: number;
  };
  systemCpuUsage?: number;
  onlineCpus?: number;
  throttlingData: {
    periods: number;
    throttledPeriods: number;
    throttledTime: number;
  };
}

export interface MemoryStats {
  usage: number;
  maxUsage: number;
  stats: Record<string, number>;
  limit: number;
}

export interface NetworkStats {
  rxBytes: number;
  rxPackets: number;
  rxErrors: number;
  rxDropped: number;
  txBytes: number;
  txPackets: number;
  txErrors: number;
  txDropped: number;
}

export interface ContainerProcess {
  titles: string[];
  processes: string[][];
}

export interface ContainerChange {
  path: string;
  kind: 0 | 1 | 2; // 0: Modified, 1: Added, 2: Deleted
}

// =============================================================================
// Image Types
// =============================================================================

export interface Image {
  id: string;
  parentId: string;
  repoTags: string[];
  repoDigests: string[];
  created: number;
  size: number;
  sharedSize: number;
  virtualSize: number;
  labels: Record<string, string>;
  containers: number;
}

export interface ImageInspect {
  id: string;
  repoTags: string[];
  repoDigests: string[];
  parent: string;
  comment: string;
  created: string;
  container: string;
  containerConfig: ContainerConfig;
  dockerVersion: string;
  author: string;
  config: ContainerConfig;
  architecture: string;
  os: string;
  osVersion?: string;
  size: number;
  virtualSize: number;
  graphDriver: GraphDriverData;
  rootFs: {
    type: string;
    layers?: string[];
    baseLayer?: string;
  };
  metadata?: {
    lastTagTime?: string;
  };
}

export interface ImageHistory {
  id: string;
  created: number;
  createdBy: string;
  tags: string[];
  size: number;
  comment: string;
}

export interface ImageSearchResult {
  description: string;
  isOfficial: boolean;
  isAutomated: boolean;
  name: string;
  starCount: number;
}

export interface ImageBuildInput {
  dockerfile?: string;
  t?: string[];
  extrahosts?: string;
  remote?: string;
  q?: boolean;
  nocache?: boolean;
  cachefrom?: string[];
  pull?: string;
  rm?: boolean;
  forcerm?: boolean;
  memory?: number;
  memswap?: number;
  cpushares?: number;
  cpusetcpus?: string;
  cpuperiod?: number;
  cpuquota?: number;
  buildargs?: Record<string, string>;
  shmsize?: number;
  squash?: boolean;
  labels?: Record<string, string>;
  networkmode?: string;
  platform?: string;
  target?: string;
  outputs?: string;
}

export interface ImagePruneResult {
  imagesDeleted: Array<{ untagged?: string; deleted?: string }>;
  spaceReclaimed: number;
}

// =============================================================================
// Network Types
// =============================================================================

export interface Network {
  name: string;
  id: string;
  created: string;
  scope: 'swarm' | 'global' | 'local';
  driver: string;
  enableIPv6: boolean;
  ipam: IPAM;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  containers: Record<string, NetworkContainer>;
  options: Record<string, string>;
  labels: Record<string, string>;
}

export interface IPAM {
  driver: string;
  options?: Record<string, string>;
  config?: IPAMConfig[];
}

export interface IPAMConfig {
  subnet?: string;
  ipRange?: string;
  gateway?: string;
  auxAddress?: Record<string, string>;
}

export interface NetworkContainer {
  name: string;
  endpointId: string;
  macAddress: string;
  ipv4Address: string;
  ipv6Address: string;
}

export interface NetworkCreateInput {
  name: string;
  checkDuplicate?: boolean;
  driver?: string;
  internal?: boolean;
  attachable?: boolean;
  ingress?: boolean;
  ipam?: IPAM;
  enableIPv6?: boolean;
  options?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface NetworkConnectInput {
  container: string;
  endpointConfig?: EndpointSettings;
}

export interface NetworkDisconnectInput {
  container: string;
  force?: boolean;
}

export interface NetworkPruneResult {
  networksDeleted: string[];
}

// =============================================================================
// Volume Types
// =============================================================================

export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  createdAt?: string;
  status?: Record<string, string>;
  labels: Record<string, string>;
  scope: 'local' | 'global';
  options: Record<string, string>;
  usageData?: {
    size: number;
    refCount: number;
  };
}

export interface VolumeCreateInput {
  name?: string;
  driver?: string;
  driverOpts?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface VolumePruneResult {
  volumesDeleted: string[];
  spaceReclaimed: number;
}

// =============================================================================
// Exec Types
// =============================================================================

export interface ExecConfig {
  attachStdin?: boolean;
  attachStdout?: boolean;
  attachStderr?: boolean;
  detachKeys?: string;
  tty?: boolean;
  env?: string[];
  cmd: string[];
  privileged?: boolean;
  user?: string;
  workingDir?: string;
}

export interface ExecStartConfig {
  detach?: boolean;
  tty?: boolean;
}

export interface ExecInspect {
  canRemove: boolean;
  detachKeys: string;
  id: string;
  running: boolean;
  exitCode?: number;
  processConfig: {
    privileged: boolean;
    user: string;
    tty: boolean;
    entrypoint: string;
    arguments: string[];
  };
  openStdin: boolean;
  openStderr: boolean;
  openStdout: boolean;
  containerID: string;
  pid: number;
}

// =============================================================================
// System Types
// =============================================================================

export interface SystemInfo {
  id: string;
  containers: number;
  containersRunning: number;
  containersPaused: number;
  containersStopped: number;
  images: number;
  driver: string;
  driverStatus: string[][];
  dockerRootDir: string;
  systemStatus?: string[][];
  plugins: {
    volume: string[];
    network: string[];
    authorization?: string[];
    log: string[];
  };
  memoryLimit: boolean;
  swapLimit: boolean;
  kernelMemory: boolean;
  kernelMemoryTCP: boolean;
  cpuCfsPeriod: boolean;
  cpuCfsQuota: boolean;
  cpuShares: boolean;
  cpuSet: boolean;
  pidsLimit: boolean;
  oomKillDisable: boolean;
  ipv4Forwarding: boolean;
  bridgeNfIptables: boolean;
  bridgeNfIp6tables: boolean;
  debug: boolean;
  nfd: number;
  ngoroutines: number;
  systemTime: string;
  loggingDriver: string;
  cgroupDriver: string;
  cgroupVersion: string;
  neventsListener: number;
  kernelVersion: string;
  operatingSystem: string;
  osVersion: string;
  osType: string;
  architecture: string;
  ncpu: number;
  memTotal: number;
  indexServerAddress: string;
  registryConfig?: RegistryServiceConfig;
  genericResources?: GenericResource[];
  httpProxy: string;
  httpsProxy: string;
  noProxy: string;
  name: string;
  labels: string[];
  experimentalBuild: boolean;
  serverVersion: string;
  clusterStore?: string;
  clusterAdvertise?: string;
  runtimes?: Record<string, RuntimeInfo>;
  defaultRuntime: string;
  swarm?: SwarmInfo;
  liveRestoreEnabled: boolean;
  isolation?: 'default' | 'hyperv' | 'process';
  initBinary: string;
  containerdCommit: Commit;
  runcCommit: Commit;
  initCommit: Commit;
  securityOptions: string[];
  productLicense?: string;
  warnings?: string[];
}

export interface RegistryServiceConfig {
  allowNondistributableArtifactsCIDRs?: string[];
  allowNondistributableArtifactsHostnames?: string[];
  insecureRegistryCIDRs?: string[];
  indexConfigs?: Record<string, IndexInfo>;
  mirrors?: string[];
}

export interface IndexInfo {
  name: string;
  mirrors?: string[];
  secure: boolean;
  official: boolean;
}

export interface GenericResource {
  discreteResourceSpec?: { kind: string; value: number };
  namedResourceSpec?: { kind: string; value: string };
}

export interface RuntimeInfo {
  path: string;
  runtimeArgs?: string[];
}

export interface SwarmInfo {
  nodeId?: string;
  nodeAddr?: string;
  localNodeState: 'inactive' | 'pending' | 'active' | 'error' | 'locked';
  controlAvailable: boolean;
  error?: string;
  remoteManagers?: PeerNode[];
  nodes?: number;
  managers?: number;
  cluster?: ClusterInfo;
}

export interface PeerNode {
  nodeId: string;
  addr: string;
}

export interface ClusterInfo {
  id: string;
  version: ObjectVersion;
  createdAt: string;
  updatedAt: string;
  spec: SwarmSpec;
  tlsInfo?: TLSInfo;
  rootRotationInProgress: boolean;
  dataPathPort?: number;
  defaultAddrPool?: string[];
  subnetSize?: number;
}

export interface ObjectVersion {
  index: number;
}

export interface SwarmSpec {
  name?: string;
  labels?: Record<string, string>;
  orchestration?: {
    taskHistoryRetentionLimit?: number;
  };
  raft?: {
    snapshotInterval?: number;
    keepOldSnapshots?: number;
    logEntriesForSlowFollowers?: number;
    electionTick?: number;
    heartbeatTick?: number;
  };
  dispatcher?: {
    heartbeatPeriod?: number;
  };
  caConfig?: {
    nodeCertExpiry?: number;
    externalCAs?: ExternalCA[];
    signingCACert?: string;
    signingCAKey?: string;
    forceRotate?: number;
  };
  encryptionConfig?: {
    autoLockManagers?: boolean;
  };
  taskDefaults?: {
    logDriver?: LogDriverConfig;
  };
}

export interface ExternalCA {
  protocol: 'cfssl';
  url: string;
  options?: Record<string, string>;
  caCert?: string;
}

export interface LogDriverConfig {
  name: string;
  options?: Record<string, string>;
}

export interface TLSInfo {
  trustRoot: string;
  certIssuerSubject: string;
  certIssuerPublicKey: string;
}

export interface Commit {
  id: string;
  expected: string;
}

export interface SystemVersion {
  platform: { name: string };
  components: Array<{
    name: string;
    version: string;
    details?: Record<string, string>;
  }>;
  version: string;
  apiVersion: string;
  minApiVersion: string;
  gitCommit: string;
  goVersion: string;
  os: string;
  arch: string;
  kernelVersion: string;
  experimental?: boolean;
  buildTime: string;
}

export interface SystemDataUsage {
  layersSize: number;
  images: Array<{
    id: string;
    parentId: string;
    repoTags: string[];
    repoDigests: string[];
    created: number;
    size: number;
    sharedSize: number;
    virtualSize: number;
    labels: Record<string, string>;
    containers: number;
  }>;
  containers: Array<{
    id: string;
    names: string[];
    image: string;
    imageId: string;
    command: string;
    created: number;
    sizeRw: number;
    sizeRootFs: number;
    labels: Record<string, string>;
    state: string;
    status: string;
    hostConfig: { networkMode: string };
    networkSettings: { networks: Record<string, unknown> };
    mounts: Mount[];
  }>;
  volumes: Volume[];
  buildCache: BuildCache[];
}

export interface BuildCache {
  id: string;
  parent?: string;
  type: string;
  description: string;
  inUse: boolean;
  shared: boolean;
  size: number;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export interface SystemEvent {
  type: string;
  action: string;
  actor: {
    id: string;
    attributes: Record<string, string>;
  };
  time: number;
  timeNano: number;
}

export interface AuthConfig {
  username?: string;
  password?: string;
  email?: string;
  serveraddress?: string;
  identitytoken?: string;
  registrytoken?: string;
}

export interface AuthResponse {
  status: string;
  identityToken?: string;
}

// =============================================================================
// Swarm Types
// =============================================================================

export interface SwarmInitInput {
  listenAddr?: string;
  advertiseAddr?: string;
  dataPathAddr?: string;
  dataPathPort?: number;
  defaultAddrPool?: string[];
  forceNewCluster?: boolean;
  subnetSize?: number;
  spec?: SwarmSpec;
}

export interface SwarmJoinInput {
  listenAddr?: string;
  advertiseAddr?: string;
  dataPathAddr?: string;
  remoteAddrs: string[];
  joinToken: string;
}

export interface SwarmUnlockKey {
  unlockKey: string;
}

export interface SwarmNode {
  id: string;
  version: ObjectVersion;
  createdAt: string;
  updatedAt: string;
  spec: NodeSpec;
  description: NodeDescription;
  status: NodeStatus;
  managerStatus?: ManagerStatus;
}

export interface NodeSpec {
  name?: string;
  labels?: Record<string, string>;
  role: 'worker' | 'manager';
  availability: 'active' | 'pause' | 'drain';
}

export interface NodeDescription {
  hostname: string;
  platform: { architecture: string; os: string };
  resources: { nanoCPUs: number; memoryBytes: number; genericResources?: GenericResource[] };
  engine: { engineVersion: string; labels?: Record<string, string>; plugins: PluginDescription[] };
  tlsInfo?: TLSInfo;
}

export interface PluginDescription {
  type: string;
  name: string;
}

export interface NodeStatus {
  state: 'unknown' | 'down' | 'ready' | 'disconnected';
  message?: string;
  addr?: string;
}

export interface ManagerStatus {
  leader: boolean;
  reachability: 'unknown' | 'unreachable' | 'reachable';
  addr: string;
}

// =============================================================================
// Service Types
// =============================================================================

export interface Service {
  id: string;
  version: ObjectVersion;
  createdAt: string;
  updatedAt: string;
  spec: ServiceSpec;
  endpoint?: {
    spec?: EndpointSpec;
    ports?: EndpointPortConfig[];
    virtualIPs?: Array<{ networkId: string; addr: string }>;
  };
  updateStatus?: {
    state: 'updating' | 'paused' | 'completed' | 'rollback_started' | 'rollback_paused' | 'rollback_completed';
    startedAt?: string;
    completedAt?: string;
    message?: string;
  };
}

export interface ServiceSpec {
  name: string;
  labels?: Record<string, string>;
  taskTemplate: TaskSpec;
  mode?: ServiceMode;
  updateConfig?: UpdateConfig;
  rollbackConfig?: UpdateConfig;
  networks?: Array<{ target: string; aliases?: string[] }>;
  endpointSpec?: EndpointSpec;
}

export interface TaskSpec {
  pluginSpec?: {
    name: string;
    remote: string;
    disabled?: boolean;
    pluginPrivilege?: PluginPrivilege[];
  };
  containerSpec?: ContainerSpec;
  networkAttachmentSpec?: { containerID: string };
  resources?: ResourceRequirements;
  restartPolicy?: TaskRestartPolicy;
  placement?: Placement;
  forceUpdate?: number;
  runtime?: string;
  networks?: Array<{ target: string; aliases?: string[] }>;
  logDriver?: LogDriverConfig;
}

export interface PluginPrivilege {
  name: string;
  description: string;
  value: string[];
}

export interface ContainerSpec {
  image: string;
  labels?: Record<string, string>;
  command?: string[];
  args?: string[];
  hostname?: string;
  env?: string[];
  dir?: string;
  user?: string;
  groups?: string[];
  privileges?: {
    credentialSpec?: { config?: string; file?: string; registry?: string };
    seLinuxContext?: { disable?: boolean; user?: string; role?: string; type?: string; level?: string };
  };
  tty?: boolean;
  openStdin?: boolean;
  readOnly?: boolean;
  mounts?: MountPoint[];
  stopSignal?: string;
  stopGracePeriod?: number;
  healthcheck?: HealthConfig;
  hosts?: string[];
  dnsConfig?: {
    nameservers?: string[];
    search?: string[];
    options?: string[];
  };
  secrets?: SecretReference[];
  configs?: ConfigReference[];
  isolation?: 'default' | 'process' | 'hyperv';
  init?: boolean;
  sysctls?: Record<string, string>;
  capabilityAdd?: string[];
  capabilityDrop?: string[];
  ulimits?: Ulimit[];
}

export interface SecretReference {
  file: {
    name: string;
    uid: string;
    gid: string;
    mode: number;
  };
  secretId: string;
  secretName: string;
}

export interface ConfigReference {
  file: {
    name: string;
    uid: string;
    gid: string;
    mode: number;
  };
  configId: string;
  configName: string;
}

export interface ResourceRequirements {
  limits?: Resources;
  reservations?: Resources;
}

export interface Resources {
  nanoCPUs?: number;
  memoryBytes?: number;
  pids?: number;
  genericResources?: GenericResource[];
}

export interface TaskRestartPolicy {
  condition?: 'none' | 'on-failure' | 'any';
  delay?: number;
  maxAttempts?: number;
  window?: number;
}

export interface Placement {
  constraints?: string[];
  preferences?: Array<{ spread: { spreadDescriptor: string } }>;
  maxReplicas?: number;
  platforms?: Array<{ architecture: string; os: string }>;
}

export interface ServiceMode {
  replicated?: { replicas: number };
  global?: object;
  replicatedJob?: { maxConcurrent?: number; totalCompletions?: number };
  globalJob?: object;
}

export interface UpdateConfig {
  parallelism?: number;
  delay?: number;
  failureAction?: 'continue' | 'pause' | 'rollback';
  monitor?: number;
  maxFailureRatio?: number;
  order?: 'stop-first' | 'start-first';
}

export interface EndpointSpec {
  mode?: 'vip' | 'dnsrr';
  ports?: EndpointPortConfig[];
}

export interface EndpointPortConfig {
  name?: string;
  protocol: 'tcp' | 'udp' | 'sctp';
  targetPort: number;
  publishedPort?: number;
  publishMode?: 'ingress' | 'host';
}

export interface Task {
  id: string;
  version: ObjectVersion;
  createdAt: string;
  updatedAt: string;
  name?: string;
  labels?: Record<string, string>;
  spec: TaskSpec;
  serviceId: string;
  slot?: number;
  nodeId?: string;
  assignedGenericResources?: GenericResource[];
  status: {
    timestamp: string;
    state: string;
    message: string;
    err?: string;
    containerStatus?: {
      containerID: string;
      pid: number;
      exitCode?: number;
    };
  };
  desiredState: string;
}

// =============================================================================
// Secret Types
// =============================================================================

export interface Secret {
  id: string;
  version: ObjectVersion;
  createdAt: string;
  updatedAt: string;
  spec: SecretSpec;
}

export interface SecretSpec {
  name: string;
  labels?: Record<string, string>;
  data?: string;
  driver?: { name: string; options?: Record<string, string> };
  templating?: { name: string; options?: Record<string, string> };
}

export interface SecretCreateInput {
  name: string;
  labels?: Record<string, string>;
  data: string;
  driver?: { name: string; options?: Record<string, string> };
  templating?: { name: string; options?: Record<string, string> };
}

// =============================================================================
// Config Types
// =============================================================================

export interface Config {
  id: string;
  version: ObjectVersion;
  createdAt: string;
  updatedAt: string;
  spec: ConfigSpec;
}

export interface ConfigSpec {
  name: string;
  labels?: Record<string, string>;
  data: string;
  templating?: { name: string; options?: Record<string, string> };
}

export interface ConfigCreateInput {
  name: string;
  labels?: Record<string, string>;
  data: string;
  templating?: { name: string; options?: Record<string, string> };
}

// =============================================================================
// Plugin Types
// =============================================================================

export interface Plugin {
  id?: string;
  name: string;
  enabled: boolean;
  settings: {
    mounts: PluginMount[];
    env: string[];
    args: string[];
    devices: PluginDevice[];
  };
  pluginReference?: string;
  config: PluginConfig;
}

export interface PluginMount {
  name: string;
  description: string;
  settable: string[];
  source: string;
  destination: string;
  type: string;
  options: string[];
}

export interface PluginDevice {
  name: string;
  description: string;
  settable: string[];
  path: string;
}

export interface PluginConfig {
  dockerVersion?: string;
  description: string;
  documentation: string;
  interface: {
    types: string[];
    socket: string;
    protocolScheme?: string;
  };
  entrypoint: string[];
  workDir: string;
  user?: { uid?: number; gid?: number };
  network: { type: string };
  linux: {
    capabilities: string[];
    allowAllDevices: boolean;
    devices: PluginDevice[];
  };
  propagatedMount: string;
  ipcHost: boolean;
  pidHost: boolean;
  mounts: PluginMount[];
  env: PluginEnv[];
  args: PluginArgs;
  rootfs?: { type: string; diffIds: string[] };
}

export interface PluginEnv {
  name: string;
  description: string;
  settable: string[];
  value: string;
}

export interface PluginArgs {
  name: string;
  description: string;
  settable: string[];
  value: string[];
}

export interface PluginPrivilegeRequest {
  name: string;
  description: string;
  value: string[];
}

// =============================================================================
// Docker Hub Types
// =============================================================================

export interface HubRepository {
  user: string;
  name: string;
  namespace: string;
  repositoryType: 'image' | 'bundle';
  status: number;
  description: string;
  isPrivate: boolean;
  isAutomated: boolean;
  canEdit: boolean;
  starCount: number;
  pullCount: number;
  lastUpdated: string;
  isMigrated: boolean;
  collaboratorCount: number;
  affiliation?: string;
  hubUser: string;
}

export interface HubTag {
  creator: number;
  id: number;
  imageId?: string;
  images: HubTagImage[];
  lastUpdated: string;
  lastUpdater: number;
  lastUpdaterUsername: string;
  name: string;
  repository: number;
  fullSize: number;
  v2: boolean;
  tagStatus: 'active' | 'stale' | 'inactive';
  tagLastPushed: string;
  tagLastPulled?: string;
}

export interface HubTagImage {
  architecture: string;
  features: string;
  variant?: string;
  digest: string;
  os: string;
  osFeatures: string;
  osVersion?: string;
  size: number;
  status: string;
  lastPulled?: string;
  lastPushed: string;
}

export interface HubUser {
  id: string;
  username: string;
  fullName: string;
  location: string;
  company: string;
  profileUrl: string;
  dateJoined: string;
  gravataUrl: string;
  gravatarEmail: string;
  type: string;
}

export interface HubOrganization {
  id: string;
  orgname: string;
  fullName: string;
  location: string;
  company: string;
  profileUrl: string;
  dateJoined: string;
  gravatarUrl: string;
  gravatarEmail: string;
  type: string;
  badge?: string;
}

export interface HubWebhook {
  id: number;
  name: string;
  active: boolean;
  expectFinalCallback: boolean;
  webhookUrl: string;
  creator: string;
  lastUpdated: string;
  lastCaller: string;
  hooks: HubWebhookHook[];
}

export interface HubWebhookHook {
  id: number;
  hookUrl: string;
  active: boolean;
  lastCaller: string;
  lastResult: string;
}

export interface HubWebhookCreateInput {
  name: string;
  expectFinalCallback?: boolean;
  webhooks?: Array<{ hookUrl: string }>;
}

export interface HubBuildSettings {
  autotests: 'OFF' | 'INTERNAL_PULL_REQUESTS' | 'ALL_PULL_REQUESTS';
  buildForks: boolean;
  isBuilder: boolean;
  buildTags: HubBuildTag[];
}

export interface HubBuildTag {
  id: number;
  name: string;
  dockerfilePath: string;
  context: string;
  source: string;
  sourceType: 'Branch' | 'Tag';
  autoBuild: boolean;
}

export interface HubBuildHistory {
  id: number;
  status: number;
  statusText: string;
  buildTag: string;
  cause: string;
  createdDate: string;
  lastUpdated: string;
  buildPath: string;
  dockerTag: string;
  buildCode: string;
}

// =============================================================================
// Response Format
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';

// =============================================================================
// Filter Types
// =============================================================================

export interface ContainerFilters {
  ancestor?: string[];
  before?: string[];
  expose?: string[];
  exited?: number[];
  health?: ('starting' | 'healthy' | 'unhealthy' | 'none')[];
  id?: string[];
  isolation?: ('default' | 'process' | 'hyperv')[];
  isTask?: boolean[];
  label?: string[];
  name?: string[];
  network?: string[];
  publish?: string[];
  since?: string[];
  status?: ContainerState[];
  volume?: string[];
}

export interface ImageFilters {
  before?: string[];
  dangling?: boolean[];
  label?: string[];
  reference?: string[];
  since?: string[];
}

export interface NetworkFilters {
  dangling?: boolean[];
  driver?: string[];
  id?: string[];
  label?: string[];
  name?: string[];
  scope?: ('swarm' | 'global' | 'local')[];
  type?: ('custom' | 'builtin')[];
}

export interface VolumeFilters {
  dangling?: boolean[];
  driver?: string[];
  label?: string[];
  name?: string[];
}

export interface NodeFilters {
  id?: string[];
  label?: string[];
  membership?: ('accepted' | 'pending')[];
  name?: string[];
  nodeLabel?: string[];
  role?: ('manager' | 'worker')[];
}

export interface ServiceFilters {
  id?: string[];
  label?: string[];
  mode?: ('replicated' | 'global')[];
  name?: string[];
}

export interface TaskFilters {
  desiredState?: ('running' | 'shutdown' | 'accepted')[];
  id?: string[];
  label?: string[];
  name?: string[];
  node?: string[];
  service?: string[];
}

export interface SecretFilters {
  id?: string[];
  label?: string[];
  name?: string[];
}

export interface ConfigFilters {
  id?: string[];
  label?: string[];
  name?: string[];
}

export interface PluginFilters {
  capability?: string[];
  enable?: boolean[];
}
