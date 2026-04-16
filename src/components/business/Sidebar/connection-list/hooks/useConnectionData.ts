import { useCallback } from "react";
import { api } from "@/services/api";
import type { Connection, Driver, SavedQuery } from "@/services/api";

interface UseConnectionDataProps {
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  setSavedQueriesByConnection: React.Dispatch<React.SetStateAction<Record<string, SavedQuery[]>>>;
  setExpandedConnections: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedDatabases: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedDatabaseGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  t: (key: string) => string;
}

export function useConnectionData({
  setConnections,
  setSavedQueriesByConnection,
  setExpandedConnections,
  setExpandedDatabases,
  setExpandedDatabaseGroups,
  t,
}: UseConnectionDataProps) {
  const fetchConnections = useCallback(async () => {
    try {
      const conns = await api.connections.list();
      setConnections(
        conns.map((c) => ({
          id: String(c.id),
          name: c.name || t("common.unknown"),
          type: (c.dbType as Driver) || "postgres",
          host: c.host || "",
          port: String(c.port || ""),
          database: c.database || "",
          username: c.username || "",
          ssl: c.ssl || false,
          sslMode: c.sslMode || "require",
          sslCaCert: c.sslCaCert || "",
          filePath: c.filePath || "",
          sshEnabled: c.sshEnabled || false,
          sshHost: c.sshHost || "",
          sshPort: c.sshPort || 22,
          sshUsername: c.sshUsername || "root",
          sshPassword: c.sshPassword || "",
          sshKeyPath: c.sshKeyPath || "",
          isConnected: false,
          connectState: "idle" as const,
          connectError: undefined,
          databases: [],
        })),
      );
      setExpandedConnections(new Set());
      setExpandedDatabases(new Set());
      setExpandedDatabaseGroups(new Set());
    } catch (e) {
      console.error(
        "listConnections failed",
        e instanceof Error ? e.message : String(e),
      );
    }
  }, [setConnections, setExpandedConnections, setExpandedDatabases, setExpandedDatabaseGroups, t]);

  const fetchSavedQueriesByConnection = useCallback(async () => {
    try {
      const queries = await api.queries.list();
      const grouped: Record<string, SavedQuery[]> = {};
      queries.forEach((query) => {
        if (!query.connectionId) return;
        const key = String(query.connectionId);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(query);
      });
      Object.values(grouped).forEach((items) =>
        items.sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSavedQueriesByConnection(grouped);
    } catch (e) {
      console.error(
        "Failed to fetch saved queries for tree",
        e instanceof Error ? e.message : String(e),
      );
    }
  }, [setSavedQueriesByConnection]);

  return {
    fetchConnections,
    fetchSavedQueriesByConnection,
  };
}
