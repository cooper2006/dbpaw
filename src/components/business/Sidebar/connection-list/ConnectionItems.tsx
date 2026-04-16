import { memo, useMemo } from "react";

interface ConnectionItemProps {
  connection: any;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isLoading?: boolean;
}

export const ConnectionItem = memo(function ConnectionItem({
  connection,
  isExpanded,
  onToggle,
  onSelect,
  isLoading = false,
}: ConnectionItemProps) {
  const statusColor = useMemo(() => {
    if (connection.isConnected) return "text-green-600";
    if (connection.connectState === "error") return "text-red-600";
    if (connection.connectState === "connecting") return "text-yellow-600";
    return "text-gray-400";
  }, [connection.isConnected, connection.connectState]);

  return (
    <div 
      className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
      onClick={onSelect}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 hover:bg-muted rounded"
      >
        {isExpanded ? "▼" : "▶"}
      </button>
      <span className={`flex-1 ${statusColor}`}>
        {connection.name}
      </span>
      {isLoading && <span className="animate-spin">⏳</span>}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.connection.id === nextProps.connection.id &&
    prevProps.connection.name === nextProps.connection.name &&
    prevProps.connection.isConnected === nextProps.connection.isConnected &&
    prevProps.connection.connectState === nextProps.connection.connectState &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isLoading === nextProps.isLoading
  );
});

interface DatabaseItemProps {
  database: any;
  connectionId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  depth?: number;
}

export const DatabaseItem = memo(function DatabaseItem({
  database,
  connectionId,
  isExpanded,
  onToggle,
  onSelect,
  depth = 1,
}: DatabaseItemProps) {
  return (
    <div 
      className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={onSelect}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 hover:bg-muted rounded"
      >
        {isExpanded ? "▼" : "▶"}
      </button>
      <span className="flex-1 truncate">{database.name}</span>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.database.name === nextProps.database.name &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.depth === nextProps.depth
  );
});

interface TableItemProps {
  table: any;
  databaseName: string;
  schemaName?: string;
  connectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  depth?: number;
}

export const TableItem = memo(function TableItem({
  table,
  databaseName,
  schemaName,
  connectionId,
  isSelected,
  onSelect,
  depth = 2,
}: TableItemProps) {
  return (
    <div 
      className={`flex items-center gap-2 p-2 cursor-pointer ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={onSelect}
    >
      <span className="flex-1 truncate">{table.name}</span>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.table.name === nextProps.table.name &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.depth === nextProps.depth
  );
});

interface SchemaItemProps {
  schema: any;
  databaseName: string;
  connectionId: string;
  isExpanded: boolean;
  onToggle: () => void;
  depth?: number;
}

export const SchemaItem = memo(function SchemaItem({
  schema,
  databaseName,
  connectionId,
  isExpanded,
  onToggle,
  depth = 2,
}: SchemaItemProps) {
  return (
    <div 
      className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <button 
        className="p-1 hover:bg-muted rounded"
      >
        {isExpanded ? "▼" : "▶"}
      </button>
      <span className="flex-1 truncate">{schema.name}</span>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.schema.name === nextProps.schema.name &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.depth === nextProps.depth
  );
});
