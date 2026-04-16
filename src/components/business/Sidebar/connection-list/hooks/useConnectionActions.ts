import { useCallback } from "react";
import { toast } from "sonner";
import { api, isTauri } from "@/services/api";
import type { ConnectionForm, Driver, Connection } from "@/services/api";
import { useTranslation } from "react-i18next";

interface UseConnectionActionsProps {
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  onConnect?: (connectionId: string) => void;
  onCreateQuery?: (connectionId: string, connectionName: string) => void;
  onExportTable?: (params: {
    connectionId: string;
    database: string;
    table: string;
    format: string;
  }) => void;
  onExportDatabase?: (params: {
    connectionId: string;
    database: string;
    format: string;
  }) => void;
}

export function useConnectionActions({
  connections,
  setConnections,
  onConnect,
  onCreateQuery,
  onExportTable,
  onExportDatabase,
}: UseConnectionActionsProps) {
  const { t } = useTranslation();

  const connectConnection = useCallback(
    async (connectionId: string) => {
      try {
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === connectionId
              ? { ...conn, connectState: "connecting" as const, connectError: undefined }
              : conn,
          ),
        );

        const result = await api.connections.connect(Number(connectionId));
        
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  isConnected: true,
                  connectState: "success" as const,
                  databases: result.databases || [],
                }
              : conn,
          ),
        );

        toast.success(t("connection.toast.connected"), {
          description: t("connection.toast.connectedDesc", { name: result.name }),
        });

        onConnect?.(connectionId);
      } catch (error) {
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  isConnected: false,
                  connectState: "error" as const,
                  connectError: error instanceof Error ? error.message : String(error),
                }
              : conn,
          ),
        );

        toast.error(t("connection.toast.connectionFailed"));
      }
    },
    [setConnections, onConnect, t],
  );

  const disconnectConnection = useCallback(
    async (connectionId: string) => {
      try {
        await api.connections.disconnect(Number(connectionId));
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === connectionId
              ? { ...conn, isConnected: false, connectState: "idle" as const }
              : conn,
          ),
        );
        toast.success(t("connection.toast.disconnected"));
      } catch (error) {
        toast.error(t("connection.toast.disconnectFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [setConnections, t],
  );

  const deleteConnection = useCallback(
    async (connectionId: string) => {
      try {
        await api.connections.delete(Number(connectionId));
        setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
        toast.success(t("connection.toast.deleted"));
      } catch (error) {
        toast.error(t("connection.toast.deleteFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [setConnections, t],
  );

  const duplicateConnection = useCallback(
    async (connectionId: string) => {
      try {
        const connection = connections.find((conn) => conn.id === connectionId);
        if (!connection) return;

        const newConnection: ConnectionForm = {
          driver: connection.type as Driver,
          name: `${connection.name} (Copy)`,
          host: connection.host,
          port: Number(connection.port),
          database: connection.database,
          username: connection.username,
          password: "",
          ssl: connection.ssl,
          sslMode: connection.sslMode,
          sslCaCert: connection.sslCaCert,
          filePath: connection.filePath,
          sshEnabled: connection.sshEnabled,
          sshHost: connection.sshHost,
          sshPort: connection.sshPort,
          sshUsername: connection.sshUsername,
          sshPassword: connection.sshPassword,
          sshKeyPath: connection.sshKeyPath,
        };

        const created = await api.connections.create(newConnection);
        setConnections((prev) => [...prev, {
          ...created,
          databases: [],
          isConnected: false,
          connectState: "idle" as const,
        }]);
        
        toast.success(t("connection.toast.duplicated"));
      } catch (error) {
        toast.error(t("connection.toast.duplicateFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [connections, setConnections, t],
  );

  const testConnection = useCallback(
    async (form: ConnectionForm) => {
      try {
        const result = await api.connections.test(form);
        return {
          ok: true,
          text: t("connection.toast.testSuccess"),
          latency: result.latency,
        };
      } catch (error) {
        return {
          ok: false,
          text: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [t],
  );

  const createQuery = useCallback(
    (connectionId: string) => {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection && onCreateQuery) {
        onCreateQuery(connectionId, connection.name);
      }
    },
    [connections, onCreateQuery],
  );

  const exportTable = useCallback(
    (connection: Connection, database: any, table: any, format: string) => {
      if (onExportTable) {
        onExportTable({
          connectionId: connection.id,
          database: database.name,
          table: table.name,
          format,
        });
      }
    },
    [onExportTable],
  );

  const exportDatabase = useCallback(
    (connectionId: string, databaseName: string, driver: Driver, format: string) => {
      if (onExportDatabase) {
        onExportDatabase({
          connectionId,
          database: databaseName,
          format,
        });
      }
    },
    [onExportDatabase],
  );

  return {
    connectConnection,
    disconnectConnection,
    deleteConnection,
    duplicateConnection,
    testConnection,
    createQuery,
    exportTable,
    exportDatabase,
  };
}
