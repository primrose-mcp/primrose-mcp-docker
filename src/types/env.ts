/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (Docker hosts,
 * Hub tokens, etc.) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Request Headers for Docker Engine:
 * - X-Docker-Host: Docker Engine API host (e.g., tcp://host:2375)
 * - X-Docker-TLS-Verify: Enable TLS verification (1/0)
 * - X-Docker-Cert-Path: Path to TLS certificates
 *
 * Request Headers for Docker Hub:
 * - X-Docker-Hub-Token: Docker Hub API token
 * - X-Docker-Hub-Username: Docker Hub username
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Docker Engine API host (from X-Docker-Host header) */
  dockerHost?: string;

  /** Docker Engine TLS verification (from X-Docker-TLS-Verify header) */
  tlsVerify?: boolean;

  /** Docker Engine TLS cert path (from X-Docker-Cert-Path header) */
  certPath?: string;

  /** Docker Engine API version (from X-Docker-API-Version header) */
  apiVersion?: string;

  /** Docker Hub API token (from X-Docker-Hub-Token header) */
  hubToken?: string;

  /** Docker Hub username (from X-Docker-Hub-Username header) */
  hubUsername?: string;

  /** Docker Hub password (from X-Docker-Hub-Password header) */
  hubPassword?: string;

  /** Docker Registry URL (from X-Docker-Registry header) */
  registryUrl?: string;

  /** Docker Registry username (from X-Docker-Registry-Username header) */
  registryUsername?: string;

  /** Docker Registry password (from X-Docker-Registry-Password header) */
  registryPassword?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    dockerHost: headers.get('X-Docker-Host') || undefined,
    tlsVerify: headers.get('X-Docker-TLS-Verify') === '1',
    certPath: headers.get('X-Docker-Cert-Path') || undefined,
    apiVersion: headers.get('X-Docker-API-Version') || undefined,
    hubToken: headers.get('X-Docker-Hub-Token') || undefined,
    hubUsername: headers.get('X-Docker-Hub-Username') || undefined,
    hubPassword: headers.get('X-Docker-Hub-Password') || undefined,
    registryUrl: headers.get('X-Docker-Registry') || undefined,
    registryUsername: headers.get('X-Docker-Registry-Username') || undefined,
    registryPassword: headers.get('X-Docker-Registry-Password') || undefined,
  };
}

/**
 * Validate that required credentials are present for Docker Engine operations
 */
export function validateDockerEngineCredentials(credentials: TenantCredentials): void {
  if (!credentials.dockerHost) {
    throw new Error(
      'Missing Docker Engine credentials. Provide X-Docker-Host header with the Docker daemon URL.'
    );
  }
}

/**
 * Validate that required credentials are present for Docker Hub operations
 */
export function validateDockerHubCredentials(credentials: TenantCredentials): void {
  if (!credentials.hubToken && !(credentials.hubUsername && credentials.hubPassword)) {
    throw new Error(
      'Missing Docker Hub credentials. Provide either X-Docker-Hub-Token header or both X-Docker-Hub-Username and X-Docker-Hub-Password headers.'
    );
  }
}

/**
 * Check if Docker Engine credentials are available
 */
export function hasDockerEngineCredentials(credentials: TenantCredentials): boolean {
  return !!credentials.dockerHost;
}

/**
 * Check if Docker Hub credentials are available
 */
export function hasDockerHubCredentials(credentials: TenantCredentials): boolean {
  return !!(credentials.hubToken || (credentials.hubUsername && credentials.hubPassword));
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for caching */
  DOCKER_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
