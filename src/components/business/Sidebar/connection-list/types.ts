import type { Driver } from "@/services/api";

export interface Column {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  nullable?: boolean;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: Column[];
}

export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
}

export interface DatabaseInfo {
  name: string;
  schemas: SchemaInfo[];
  tables: TableInfo[];
}

export interface Connection {
  id: string;
  name: string;
  type: Driver;
  host: string;
  port: string;
  database?: string;
  username: string;
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
  databases: DatabaseInfo[];
  isConnected: boolean;
  connectState: "idle" | "connecting" | "success" | "error";
  connectError?: string;
  filteredSavedQueries?: any[];
}

export interface CreateDatabaseForm {
  name: string;
  ifNotExists: boolean;
  charset: string;
  collation: string;
  encoding: string;
  lcCollate: string;
  lcCtype: string;
}

export interface SelectedTableNode {
  key: string;
  connectionId: number;
  database: string;
  table: string;
  schema: string;
}

export type DatabaseExportFormat = "sql_dml" | "sql_ddl" | "sql_full";
export type TableExportFormat = "csv" | "json" | "sql_dml" | "sql_ddl" | "sql_full";
