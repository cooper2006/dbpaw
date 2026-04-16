import { useMemo } from "react";
import { Database, Table, Table2 as TableIcon, Key, Copy, Edit3, Plus, RefreshCw, Play, Loader2, Trash2, FileCode, Search, Download, FolderOpen, Upload, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { Connection, Driver, SavedQuery } from "@/services/api";
import { TreeNode } from "./TreeNode";
import { ConnectionItems } from "./ConnectionItems";
import { renderConnectionStatusIndicator, getExportDefaultName, getExportFilter } from "../helpers";
import { getConnectionIcon, getDefaultPort, isFileBasedDriver, supportsSSLCA, isMysqlFamilyDriver, supportsCreateDatabase, supportsSchemaBrowsing } from "@/lib/driver-registry";

interface ConnectionListViewProps {
  connections: Connection[];
  expandedConnections: Set<string>;
  expandedDatabases: Set<string>;
  expandedDatabaseGroups: Set<string>;
  expandedQueryGroups: Set<string>;
  expandedSchemas: Set<string>;
  expandedTables: Set<string>;
  selectedTableKey: string | null;
  searchTerm: string;
  loadingDatabaseKeys: Set<string>;
  loadingTableKeys: Set<string>;
  loadingSpinner: React.ReactNode;
  savedQueriesByConnection: Record<string, SavedQuery[]>;
  showSavedQueriesInTree: boolean;
  sidebarRevealRequest: number | null;
  activeTableTarget: { connectionId?: number; database?: string; table?: string; schema?: string } | null;
  onToggleConnection: (id: string) => void;
  onToggleDatabase: (key: string) => void;
  onToggleDatabaseGroup: (name: string) => void;
  onToggleQueryGroup: (name: string) => void;
  onToggleSchema: (key: string) => void;
  onToggleTable: (key: string) => void;
  onConnect: (connectionId: string) => void;
  onDisconnect: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
  onDuplicate: (connectionId: string) => void;
  onEdit: (connectionId: string) => void;
  onCreateQuery: (connectionId: string) => void;
  onRefreshMetadata: (connectionId: string, databaseName: string, schemaName?: string) => void;
  onExportTable: (connection: Connection, database: any, table: any, format: string) => void;
  onExportDatabase: (connectionId: string, databaseName: string, driver: Driver, format: string) => void;
  onImportSql: (connectionId: string, databaseName: string, driver: Driver) => void;
  onAlterTable: (connectionId: string, database: string, table: string, schema?: string) => void;
  onCreateTable: (connectionId: string, database: string, schema?: string) => void;
  onViewTableMetadata: (connectionId: string, database: string, table: string, schema?: string) => void;
  onSelectSavedQuery: (query: SavedQuery) => void;
  onContextMenu: (e: React.MouseEvent, type: "connection" | "database" | "schema", connectionId?: string, databaseName?: string, schemaName?: string) => void;
  t: (key: string) => string;
}

export function ConnectionListView({
  connections,
  expandedConnections,
  expandedDatabases,
  expandedDatabaseGroups,
  expandedQueryGroups,
  expandedSchemas,
  expandedTables,
  selectedTableKey,
  searchTerm,
  loadingDatabaseKeys,
  loadingTableKeys,
  loadingSpinner,
  savedQueriesByConnection,
  showSavedQueriesInTree,
  sidebarRevealRequest,
  activeTableTarget,
  onToggleConnection,
  onToggleDatabase,
  onToggleDatabaseGroup,
  onToggleQueryGroup,
  onToggleSchema,
  onToggleTable,
  onConnect,
  onDisconnect,
  onDelete,
  onDuplicate,
  onEdit,
  onCreateQuery,
  onRefreshMetadata,
  onExportTable,
  onExportDatabase,
  onImportSql,
  onAlterTable,
  onCreateTable,
  onViewTableMetadata,
  onSelectSavedQuery,
  onContextMenu,
  t,
}: ConnectionListViewProps) {
  const filteredConnections = useMemo(() => {
    if (!searchTerm.trim()) return connections;
    const term = searchTerm.toLowerCase();
    return connections.filter(
      (conn) =>
        conn.name.toLowerCase().includes(term) ||
        conn.host.toLowerCase().includes(term) ||
        (conn.database && conn.database.toLowerCase().includes(term)) ||
        conn.type.toLowerCase().includes(term),
    );
  }, [connections, searchTerm]);

  const supportsCreateDatabaseForDriver = (driver: Driver) =>
    supportsCreateDatabase(driver);
  const supportsSchemaNodeForDriver = (driver: Driver) =>
    supportsSchemaBrowsing(driver);
  const getSchemaNodeKey = (databaseKey: string, schema: string) =>
    `${databaseKey}::${schema}`;
  const getTableNodeKey = (
    connectionId: string,
    databaseName: string,
    schemaName: string | undefined,
    tableName: string,
  ) =>
    `${connectionId}::${databaseName}::${schemaName ?? ""}::${tableName}`;
  const getDatabaseGroupKey = (name: string) => `group::${name}`;
  const getQueryGroupKey = (connectionId: string) => `queries::${connectionId}`;

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("connection.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => {}}
            className="pl-8"
          />
        </div>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-auto p-2">
        {filteredConnections.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? t("connection.noMatches") : t("connection.noConnections")}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConnections.map((connection) => {
              const isExpanded = expandedConnections.has(connection.id);
              const Icon = getConnectionIcon(connection.type);
              const canCreateDatabase = supportsCreateDatabaseForDriver(connection.type);
              const hasSchemaSupport = supportsSchemaNodeForDriver(connection.type);

              return (
                <div key={connection.id}>
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <div
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer group"
                        onClick={() => onToggleConnection(connection.id)}
                        onContextMenu={(e) => onContextMenu(e, "connection", connection.id)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleConnection(connection.id);
                          }}
                        >
                          {isExpanded ? (
                            <span className="text-xs">▼</span>
                          ) : (
                            <span className="text-xs">▶</span>
                          )}
                        </Button>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate font-medium">{connection.name}</span>
                        {renderConnectionStatusIndicator(connection.connectState, connection.isConnected)}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!connection.isConnected ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConnect(connection.id);
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateQuery(connection.id);
                                }}
                              >
                                <FileCode className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDisconnect(connection.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      {!connection.isConnected ? (
                        <>
                          <ContextMenuItem onClick={() => onConnect(connection.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            {t("connection.context.connect")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onEdit(connection.id)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            {t("connection.context.edit")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onDuplicate(connection.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t("connection.context.duplicate")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onDelete(connection.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("connection.context.delete")}
                          </ContextMenuItem>
                        </>
                      ) : (
                        <>
                          <ContextMenuItem onClick={() => onCreateQuery(connection.id)}>
                            <FileCode className="mr-2 h-4 w-4" />
                            {t("connection.context.newQuery")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onDisconnect(connection.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("connection.context.disconnect")}
                          </ContextMenuItem>
                          {canCreateDatabase && (
                            <ContextMenuItem onClick={() => {}}>
                              <Plus className="mr-2 h-4 w-4" />
                              {t("connection.context.createDatabase")}
                            </ContextMenuItem>
                          )}
                          <ContextMenuItem onClick={() => onImportSql(connection.id, connection.database || "", connection.type)}>
                            <Upload className="mr-2 h-4 w-4" />
                            {t("connection.context.importSql")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onEdit(connection.id)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            {t("connection.context.edit")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onDuplicate(connection.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t("connection.context.duplicate")}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onDelete(connection.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("connection.context.delete")}
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>

                  {isExpanded && connection.isConnected && (
                    <div className="ml-6 mt-1 space-y-1">
                      {/* Databases */}
                      {connection.databases.map((db) => {
                        const dbKey = `${connection.id}::${db.name}`;
                        const isDbExpanded = expandedDatabases.has(dbKey);
                        const hasSchemaSupportForDb = hasSchemaSupport;

                        return (
                          <div key={db.name}>
                            <ContextMenu>
                              <ContextMenuTrigger>
                                <div
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer group"
                                  onClick={() => onToggleDatabase(dbKey)}
                                  onContextMenu={(e) => onContextMenu(e, "database", connection.id, db.name)}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleDatabase(dbKey);
                                    }}
                                  >
                                    {isDbExpanded ? (
                                      <span className="text-xs">▼</span>
                                    ) : (
                                      <span className="text-xs">▶</span>
                                    )}
                                  </Button>
                                  <Database className="h-4 w-4 text-muted-foreground" />
                                  <span className="flex-1 truncate">{db.name}</span>
                                  {loadingDatabaseKeys.has(dbKey) && loadingSpinner}
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => onRefreshMetadata(connection.id, db.name)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  {t("connection.context.refresh")}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => onExportDatabase(connection.id, db.name, connection.type, "sql_full")}>
                                  <Download className="mr-2 h-4 w-4" />
                                  {t("connection.context.exportDatabase")}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => onCreateTable(connection.id, db.name)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  {t("connection.context.createTable")}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>

                            {isDbExpanded && (
                              <div className="ml-6 mt-1 space-y-1">
                                {/* Schemas (if supported) */}
                                {hasSchemaSupportForDb && db.schemas && db.schemas.length > 0 && (
                                  <>
                                    {db.schemas.map((schema) => {
                                      const schemaKey = getSchemaNodeKey(dbKey, schema.name);
                                      const isSchemaExpanded = expandedSchemas.has(schemaKey);

                                      return (
                                        <div key={schema.name}>
                                          <ContextMenu>
                                            <ContextMenuTrigger>
                                              <div
                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer group"
                                                onClick={() => onToggleSchema(schemaKey)}
                                                onContextMenu={(e) => onContextMenu(e, "schema", connection.id, db.name, schema.name)}
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6 shrink-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleSchema(schemaKey);
                                                  }}
                                                >
                                                  {isSchemaExpanded ? (
                                                    <span className="text-xs">▼</span>
                                                  ) : (
                                                    <span className="text-xs">▶</span>
                                                  )}
                                                </Button>
                                                <span className="flex-1 truncate">{schema.name}</span>
                                                {loadingDatabaseKeys.has(schemaKey) && loadingSpinner}
                                              </div>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                              <ContextMenuItem onClick={() => onRefreshMetadata(connection.id, db.name, schema.name)}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                {t("connection.context.refresh")}
                                              </ContextMenuItem>
                                              <ContextMenuItem onClick={() => onCreateTable(connection.id, db.name, schema.name)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                {t("connection.context.createTable")}
                                              </ContextMenuItem>
                                            </ContextMenuContent>
                                          </ContextMenu>

                                          {isSchemaExpanded && (
                                            <div className="ml-6 mt-1 space-y-1">
                                              {schema.tables.map((table) => {
                                                const tableKey = getTableNodeKey(connection.id, db.name, schema.name, table.name);
                                                const isTableExpanded = expandedTables.has(tableKey);
                                                const isLoading = loadingTableKeys.has(tableKey);

                                                return (
                                                  <TreeNode
                                                    key={tableKey}
                                                    nodeKey={tableKey}
                                                    name={table.name}
                                                    icon={TableIcon}
                                                    isExpanded={isTableExpanded}
                                                    isLoading={isLoading}
                                                    loadingSpinner={loadingSpinner}
                                                    isSelected={selectedTableKey === tableKey}
                                                    onToggle={() => onToggleTable(tableKey)}
                                                    onSelect={() => {}}
                                                    onContextMenu={(e) => {
                                                      e.stopPropagation();
                                                    }}
                                                    actions={
                                                      <>
                                                        <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAlterTable(connection.id, db.name, table.name, schema.name);
                                                          }}
                                                        >
                                                          <Edit3 className="h-3 w-3" />
                                                        </Button>
                                                      </>
                                                    }
                                                    t={t}
                                                  />
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Tables (direct, if no schema support or in addition to schemas) */}
                                {!hasSchemaSupportForDb && db.tables && db.tables.length > 0 && (
                                  <>
                                    {db.tables.map((table) => {
                                      const tableKey = getTableNodeKey(connection.id, db.name, undefined, table.name);
                                      const isTableExpanded = expandedTables.has(tableKey);
                                      const isLoading = loadingTableKeys.has(tableKey);

                                      return (
                                        <TreeNode
                                          key={tableKey}
                                          nodeKey={tableKey}
                                          name={table.name}
                                          icon={TableIcon}
                                          isExpanded={isTableExpanded}
                                          isLoading={isLoading}
                                          loadingSpinner={loadingSpinner}
                                          isSelected={selectedTableKey === tableKey}
                                          onToggle={() => onToggleTable(tableKey)}
                                          onSelect={() => {}}
                                          onContextMenu={(e) => {
                                            e.stopPropagation();
                                          }}
                                          actions={
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onAlterTable(connection.id, db.name, table.name);
                                                }}
                                              >
                                                <Edit3 className="h-3 w-3" />
                                              </Button>
                                            </>
                                          }
                                          t={t}
                                        />
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Saved Queries */}
                      {showSavedQueriesInTree && savedQueriesByConnection[connection.id] && (
                        <div className="mt-2">
                          <div
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => onToggleQueryGroup(getQueryGroupKey(connection.id))}
                          >
                            <span className="text-xs">
                              {expandedQueryGroups.has(getQueryGroupKey(connection.id)) ? "▼" : "▶"}
                            </span>
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("connection.savedQueries")}</span>
                          </div>

                          {expandedQueryGroups.has(getQueryGroupKey(connection.id)) && (
                            <div className="ml-6 mt-1 space-y-1">
                              {savedQueriesByConnection[connection.id].map((query) => (
                                <div
                                  key={query.id}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                  onClick={() => onSelectSavedQuery(query)}
                                >
                                  <Code className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm truncate">{query.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-2 border-t flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          {t("connection.add")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <FolderOpen className="h-4 w-4 mr-2" />
          {t("connection.import")}
        </Button>
      </div>
    </div>
  );
}
