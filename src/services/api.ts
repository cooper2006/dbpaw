// Import Tauri invoke function
import { invoke } from "@tauri-apps/api/core";

// Helper to check if running in Tauri
export const isTauri = () => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

// API base URL - use localhost for development
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:17300";

// HTTP client helper
class HttpClient {
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(path: string, data?: any): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async put<T>(path: string, data?: any): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    const response = await fetch(url.toString(), {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}

const http = new HttpClient();

export interface QueryColumn {
  name: string;
  type: string;
}

export interface QueryResult {
  data: any[];
  rowCount: number;
  columns: QueryColumn[];
  timeTakenMs: number;
  success: boolean;
  error?: string;
}

export interface RedisDatabaseInfo {
  index: number;
  name: string;
  selected: boolean;
}

export interface RedisKeyInfo {
  key: string;
  keyType: string;
  ttl: number;
}

export interface RedisScanResponse {
  cursor: number;
  keys: RedisKeyInfo[];
  isPartial: boolean;
}

export type RedisValue =
  | { kind: "string"; value: string }
  | { kind: "hash"; value: Record<string, string> }
  | { kind: "list"; value: string[] }
  | { kind: "set"; value: string[] }
  | { kind: "zSet"; value: { member: string; score: number }[] }
  | { kind: "none"; value?: null };

export interface RedisKeyValue {
  key: string;
  keyType: string;
  ttl: number;
  value: RedisValue;
  valueTotalLen: number | null;
  valueOffset: number;
}

export interface RedisSetKeyPayload {
  key: string;
  value: RedisValue;
  ttlSeconds?: number | null;
}

export interface RedisMutationResult {
  success: boolean;
  affected: number;
}

export interface RedisRawResult {
  output: string;
}

export type SqlExecutionSource =
  | "sql_editor"
  | "table_view_save"
  | "execute_by_conn"
  | "unknown";

export interface SqlExecutionLog {
  id: number;
  sql: string;
  source?: string | null;
  connectionId?: number | null;
  database?: string | null;
  success: boolean;
  error?: string | null;
  executedAt: string;
}

import {
  DRIVER_REGISTRY,
  type Driver,
  type ImportDriverCapability,
} from "@/lib/driver-registry";
export type { Driver, ImportDriverCapability } from "@/lib/driver-registry";

export const normalizeImportDriver = (driver: string): string => {
  const normalized = (driver || "").trim().toLowerCase();
  if (normalized === "postgresql" || normalized === "pgsql") {
    return "postgres";
  }
  return normalized;
};

export const getImportDriverCapability = (
  driver: string,
): ImportDriverCapability => {
  const normalized = normalizeImportDriver(driver);
  const config = DRIVER_REGISTRY.find((d) => d.id === normalized);
  return config?.importCapability ?? "unsupported";
};
export interface ConnectionForm {
  driver: Driver;
  name?: string;
  host?: string;
  port?: number;
  database?: string;
  schema?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  sslMode?: "require" | "verify_ca";
  sslCaCert?: string;
  filePath?: string;
  sshEnabled?: boolean;
  sshHost?: string;
  sshPort?: number;
  sshUsername?: string;
  sshPassword?: string;
  sshKeyPath?: string;
}

export interface CreateDatabasePayload {
  name: string;
  ifNotExists?: boolean;
  charset?: string;
  collation?: string;
  encoding?: string;
  lcCollate?: string;
  lcCtype?: string;
}
export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface ColumnSchema {
  name: string;
  type: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | null;
  primaryKey: boolean;
  comment?: string | null;
}

export interface IndexInfo {
  name: string;
  unique: boolean;
  indexType?: string | null;
  columns: string[];
}

export interface ForeignKeyInfo {
  name: string;
  column: string;
  referencedSchema?: string | null;
  referencedTable: string;
  referencedColumn: string;
  onUpdate?: string | null;
  onDelete?: string | null;
}

export interface ClickHouseTableExtra {
  engine: string;
  partitionKey?: string | null;
  sortingKey?: string | null;
  primaryKeyExpr?: string | null;
  samplingKey?: string | null;
  ttlExpr?: string | null;
  createTableQuery?: string | null;
}

export interface TableMetadata {
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  clickhouseExtra?: ClickHouseTableExtra | null;
}

export interface TableSchema {
  schema: string;
  name: string;
  columns: ColumnSchema[];
}

export interface SchemaOverview {
  tables: TableSchema[];
}

export interface SavedQuery {
  id: number;
  name: string;
  query: string;
  description?: string | null;
  connectionId?: number | null;
  database?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SqliteConnectionIssue {
  id: number;
  connectionId: number;
  connectionName: string;
  filePath: string;
  issueType:
    | "locked"
    | "corrupted"
    | "permission_denied"
    | "not_found"
    | string;
  description: string;
  detectedAt: string;
  resolvedAt?: string | null;
}

export interface AIProviderConfig {
  id: number;
  name: string;
  providerType: AIProviderType;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  isDefault: boolean;
  enabled: boolean;
  extraJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AIProviderType = string;

export interface AIProviderForm {
  name: string;
  providerType?: AIProviderType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  isDefault?: boolean;
  enabled?: boolean;
  extraJson?: string;
}

export interface AIUsage {
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface AIConversation {
  id: number;
  title: string;
  scenario: string;
  connectionId?: number | null;
  database?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: number;
  conversationId: number;
  role: "system" | "developer" | "user" | "assistant" | "tool" | string;
  content: string;
  promptVersion?: string | null;
  model?: string | null;
  tokenIn?: number | null;
  tokenOut?: number | null;
  latencyMs?: number | null;
  createdAt: string;
}

export interface AIConversationDetail {
  conversation: AIConversation;
  messages: AIMessage[];
}

export interface AITableSummary {
  schema: string;
  name: string;
  columns: { name: string; type: string; nullable?: boolean }[];
}

export interface AISchemaOverview {
  tables: AITableSummary[];
}

export interface AISelectedTableRef {
  schema: string;
  name: string;
}

export interface AIChatRequest {
  requestId: string;
  providerId?: number;
  conversationId?: number;
  scenario: "sql_generate" | "sql_optimize" | "sql_explain" | string;
  input: string;
  title?: string;
  connectionId?: number;
  database?: string;
  schemaOverview?: AISchemaOverview;
  selectedTables?: AISelectedTableRef[];
}

export interface AIChatResponse {
  conversationId: number;
  userMessageId: number;
  assistantMessageId: number;
}

export type TransferFormat =
  | "csv"
  | "json"
  | "sql_dml"
  | "sql_ddl"
  | "sql_full";
export type ExportScope =
  | "current_page"
  | "filtered"
  | "full_table"
  | "query_result";

export interface ExportResult {
  filePath: string;
  rowCount: number;
}

export interface ImportSqlResult {
  filePath: string;
  totalStatements: number;
  successStatements: number;
  failedAt?: number;
  failedBatch?: number;
  failedStatementPreview?: string;
  error?: string;
  timeTakenMs: number;
  rolledBack: boolean;
}

export const api = {
  query: {
    execute: (
      id: number,
      query: string,
      database?: string,
      source?: SqlExecutionSource,
      queryId?: string,
    ) =>
      http.post<QueryResult>("/api/query/execute", {
        id,
        query,
        database,
        source,
        queryId,
      }),
    cancel: (uuid: string, queryId: string) =>
      http.post<boolean>("/api/query/cancel", { uuid, queryId }),
    executeByConn: (form: ConnectionForm, sql: string) =>
      http.post<QueryResult>("/api/query/execute-by-conn", { form, sql }),
    executeFederated: (query: string, source?: SqlExecutionSource) =>
      http.post<QueryResult>("/api/query/execute-federated", { query, source }),
  },
  sqlLogs: {
    list: (limit = 100) =>
      http.get<SqlExecutionLog[]>("/api/query/sql-logs", { limit }),
  },
  metadata: {
    listTables: (id: number, database?: string, schema?: string) =>
      http.get<{ schema: string; name: string; type: string }[]>("/api/metadata/tables", {
        id,
        database,
        schema,
      }),
    getTableStructure: (id: number, schema: string, table: string) =>
      http.get<{ columns: { name: string; type: string; nullable: boolean }[] }>(
        "/api/metadata/table-structure",
        { id, schema, table },
      ),
    getTableDDL: (
      id: number,
      database: string | undefined,
      schema: string,
      table: string,
    ) => http.get<string>("/api/metadata/table-ddl", { id, database, schema, table }),
    getTableMetadata: (
      id: number,
      database: string | undefined,
      schema: string,
      table: string,
    ) =>
      http.get<TableMetadata>("/api/metadata/table-metadata", {
        id,
        database,
        schema,
        table,
      }),
    listDatabasesById: (id: number) =>
      http.get<string[]>("/api/connections/databases", { id }),
    getSchemaOverview: (id: number, database?: string, schema?: string) =>
      http.get<SchemaOverview>("/api/metadata/schema-overview", { id, database, schema }),
  },
  tableData: {
    get: (params: {
      id: number;
      database?: string;
      schema: string;
      table: string;
      page: number;
      limit: number;
      filter?: string;
      sortColumn?: string;
      sortDirection?: "asc" | "desc";
      orderBy?: string;
    }) =>
      http.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        executionTimeMs: number;
      }>("/api/query/table-data", params),
  },
  transfer: {
    exportTable: (params: {
      id: number;
      database?: string;
      schema: string;
      table: string;
      driver: string;
      format: TransferFormat;
      scope: Exclude<ExportScope, "query_result">;
      filter?: string;
      orderBy?: string;
      sortColumn?: string;
      sortDirection?: "asc" | "desc";
      page?: number;
      limit?: number;
      filePath?: string;
      chunkSize?: number;
    }) => http.post<ExportResult>("/api/transfer/export-table", params),
    exportDatabase: (params: {
      id: number;
      database: string;
      driver: string;
      format: "sql_dml" | "sql_ddl" | "sql_full";
      filePath?: string;
      chunkSize?: number;
    }) => http.post<ExportResult>("/api/transfer/export-database", params),
    exportQueryResult: (params: {
      id: number;
      database?: string;
      sql: string;
      driver: string;
      format: TransferFormat;
      filePath?: string;
    }) => http.post<ExportResult>("/api/transfer/export-query", params),
    importSqlFile: (params: {
      id: number;
      database?: string;
      filePath: string;
      driver: string;
    }) => http.post<ImportSqlResult>("/api/transfer/import-sql", params),
  },
  connections: {
    list: () => http.get<any[]>("/api/connections"),
    create: (form: ConnectionForm) =>
      http.post<any>("/api/connections", form),
    update: (id: number, form: ConnectionForm) =>
      http.put<any>(`/api/connections/${id}`, form),
    delete: (id: number) => http.delete<void>(`/api/connections/${id}`),
    createDatabase: (id: number, payload: CreateDatabasePayload) =>
      http.post<void>("/api/connections/create-database", { id, payload }),
    getMysqlCharsets: (id: number) =>
      http.get<string[]>("/api/connections/mysql-charsets", { id }),
    getMysqlCollations: (id: number, charset?: string) =>
      http.get<string[]>("/api/connections/mysql-collations", { id, charset }),
    testEphemeral: (form: ConnectionForm) =>
      http.post<TestConnectionResult>("/api/connections/test", form),
  },
  redis: {
    listDatabases: (id: number) =>
      invoke<RedisDatabaseInfo[]>("redis_list_databases", { id }),
    scanKeys: (params: {
      id: number;
      database?: string;
      cursor?: number;
      pattern?: string;
      limit?: number;
    }) => invoke<RedisScanResponse>("redis_scan_keys", params),
    getKey: (id: number, database: string | undefined, key: string) =>
      invoke<RedisKeyValue>("redis_get_key", { id, database, key }),
    setKey: (
      id: number,
      database: string | undefined,
      payload: RedisSetKeyPayload,
    ) =>
      invoke<RedisMutationResult>("redis_set_key", { id, database, payload }),
    updateKey: (
      id: number,
      database: string | undefined,
      payload: RedisSetKeyPayload,
    ) =>
      invoke<RedisMutationResult>("redis_update_key", {
        id,
        database,
        payload,
      }),
    deleteKey: (id: number, database: string | undefined, key: string) =>
      invoke<RedisMutationResult>("redis_delete_key", { id, database, key }),
    renameKey: (
      id: number,
      database: string | undefined,
      oldKey: string,
      newKey: string,
    ) =>
      invoke<RedisMutationResult>("redis_rename_key", {
        id,
        database,
        oldKey,
        newKey,
      }),
    setTtl: (
      id: number,
      database: string | undefined,
      key: string,
      ttlSeconds?: number | null,
    ) =>
      invoke<RedisMutationResult>("redis_set_ttl", {
        id,
        database,
        key,
        ttlSeconds,
      }),
    getKeyPage: (
      id: number,
      database: string | undefined,
      key: string,
      offset: number,
      limit: number,
    ) =>
      invoke<RedisKeyValue>("redis_get_key_page", {
        id,
        database,
        key,
        offset,
        limit,
      }),
    executeRaw: (id: number, database: string | undefined, command: string) =>
      invoke<RedisRawResult>("redis_execute_raw", { id, database, command }),
  },
  queries: {
    list: () => http.get<SavedQuery[]>("/api/queries"),
    create: (data: {
      name: string;
      query: string;
      description?: string;
      connectionId?: number;
      database?: string;
    }) => http.post<SavedQuery>("/api/queries", data),
    update: (
      id: number,
      data: {
        name: string;
        query: string;
        description?: string;
        connectionId?: number;
        database?: string;
      },
    ) => http.put<SavedQuery>(`/api/queries/${id}`, data),
    delete: (id: number) => http.delete<void>(`/api/queries/${id}`),
  },
  ai: {
    providers: {
      list: () => http.get<AIProviderConfig[]>("/api/ai/providers"),
      create: (config: AIProviderForm) =>
        http.post<AIProviderConfig>("/api/ai/providers", config),
      update: (id: number, config: AIProviderForm) =>
        http.put<AIProviderConfig>(`/api/ai/providers/${id}`, config),
      delete: (id: number) => http.delete<void>(`/api/ai/providers/${id}`),
      setDefault: (id: number) =>
        http.put<void>(`/api/ai/providers/${id}/default`),
      clearApiKey: (providerType: string) =>
        http.post<void>(`/api/ai/providers/clear-key/${providerType}`),
    },
    chat: {
      start: (request: AIChatRequest) =>
        http.post<AIChatResponse>("/api/ai/chat/start", request),
      continue: (request: AIChatRequest) =>
        http.post<AIChatResponse>("/api/ai/chat/continue", request),
    },
    conversations: {
      list: (filters?: { connectionId?: number; database?: string }) =>
        http.get<AIConversation[]>("/api/ai/conversations", {
          connectionId: filters?.connectionId,
          database: filters?.database,
        }),
      get: (conversationId: number) =>
        http.get<AIConversationDetail>(`/api/ai/conversations/${conversationId}`),
      delete: (conversationId: number) =>
        http.delete<void>(`/api/ai/conversations/${conversationId}`),
    },
  },
};
