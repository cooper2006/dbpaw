import { useState, useCallback } from "react";
import type { Connection } from "@/services/api";

interface ExpandedState {
  connections: Set<string>;
  databases: Set<string>;
  databaseGroups: Set<string>;
  queryGroups: Set<string>;
  schemas: Set<string>;
  tables: Set<string>;
}

interface UseExpandedStateReturn extends ExpandedState {
  toggleConnection: (id: string) => void;
  toggleDatabase: (key: string) => void;
  toggleDatabaseGroup: (key: string) => void;
  toggleQueryGroup: (key: string) => void;
  toggleSchema: (key: string) => void;
  toggleTable: (key: string) => void;
  setExpandedConnections: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedDatabases: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedDatabaseGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedQueryGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedSchemas: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedTables: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useExpandedState(): UseExpandedStateReturn {
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set(["1"]),
  );
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDatabaseGroups, setExpandedDatabaseGroups] = useState<
    Set<string>
  >(new Set());
  const [expandedQueryGroups, setExpandedQueryGroups] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleConnection = useCallback((id: string) => {
    setExpandedConnections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleDatabase = useCallback((key: string) => {
    setExpandedDatabases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleDatabaseGroup = useCallback((key: string) => {
    setExpandedDatabaseGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleQueryGroup = useCallback((key: string) => {
    setExpandedQueryGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleSchema = useCallback((key: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleTable = useCallback((key: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return {
    expandedConnections,
    expandedDatabases,
    expandedDatabaseGroups,
    expandedQueryGroups,
    expandedSchemas,
    expandedTables,
    toggleConnection,
    toggleDatabase,
    toggleDatabaseGroup,
    toggleQueryGroup,
    toggleSchema,
    toggleTable,
    setExpandedConnections,
    setExpandedDatabases,
    setExpandedDatabaseGroups,
    setExpandedQueryGroups,
    setExpandedSchemas,
    setExpandedTables,
  };
}
