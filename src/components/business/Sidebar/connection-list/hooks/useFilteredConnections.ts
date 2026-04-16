import { useMemo } from "react";
import type { Connection, SavedQuery } from "@/services/api";

interface FilteredConnectionsProps {
  connections: Connection[];
  searchTerm: string;
  savedQueriesByConnection: Record<string, SavedQuery[]>;
  showSavedQueriesInTree: boolean;
}

export function useFilteredConnections({
  connections,
  searchTerm,
  savedQueriesByConnection,
  showSavedQueriesInTree,
}: FilteredConnectionsProps) {
  return useMemo(() => {
    if (!searchTerm.trim()) {
      return showSavedQueriesInTree
        ? connections.map((conn) => ({
            ...conn,
            filteredSavedQueries: savedQueriesByConnection[conn.id] || [],
          }))
        : connections;
    }

    const term = searchTerm.toLowerCase();
    return connections
      .map((conn) => {
        const nameMatch = conn.name.toLowerCase().includes(term);
        const hostMatch = conn.host.toLowerCase().includes(term);
        const typeMatch = conn.type.toLowerCase().includes(term);
        const matchesSearch = nameMatch || hostMatch || typeMatch;

        let filteredDatabases = conn.databases;
        if (!matchesSearch && searchTerm.trim()) {
          filteredDatabases = conn.databases
            .map((db) => {
              const dbMatch = db.name.toLowerCase().includes(term);
              let filteredTables = db.tables;

              if (!dbMatch) {
                filteredTables = db.tables.filter((table) =>
                  table.name.toLowerCase().includes(term),
                );
              }

              if (dbMatch || filteredTables.length > 0) {
                return {
                  ...db,
                  tables: dbMatch ? db.tables : filteredTables,
                };
              }
              return null;
            })
            .filter((db): db is NonNullable<typeof db> => db !== null);
        }

        const hasMatches =
          matchesSearch ||
          filteredDatabases.some((db) => db.tables.length > 0) ||
          filteredDatabases.length !== conn.databases.length;

        if (hasMatches) {
          return {
            ...conn,
            databases: filteredDatabases,
            filteredSavedQueries: showSavedQueriesInTree
              ? (savedQueriesByConnection[conn.id] || []).filter((q) =>
                  q.name.toLowerCase().includes(term),
                )
              : [],
          };
        }
        return null;
      })
      .filter((conn): conn is NonNullable<typeof conn> => conn !== null);
  }, [
    connections,
    searchTerm,
    savedQueriesByConnection,
    showSavedQueriesInTree,
  ]);
}
