import { useState, useCallback, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface UseTableSortProps {
  initialSortColumn?: string;
  initialSortDirection?: SortDirection;
  onSortChange?: (column: string, direction: SortDirection) => void;
}

interface UseTableSortReturn {
  sortColumn: string | null;
  sortDirection: SortDirection;
  isSorting: boolean;
  
  setSortColumn: (column: string | null) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSort: (column: string) => void;
  clearSort: () => void;
  getSortDirection: (column: string) => SortDirection;
}

export function useTableSort({
  initialSortColumn,
  initialSortDirection,
  onSortChange,
}: UseTableSortProps = {}): UseTableSortReturn {
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection || null);

  const isSorting = useMemo(() => sortColumn !== null && sortDirection !== null, [sortColumn, sortDirection]);

  const toggleSort = useCallback((column: string) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        // Cycle through: asc -> desc -> null -> asc
        setSortDirection((prevDirection) => {
          let newDirection: SortDirection = "asc";
          if (prevDirection === "asc") {
            newDirection = "desc";
          } else if (prevDirection === "desc") {
            newDirection = null;
          }
          
          if (newDirection === null) {
            setSortColumn(null);
          }
          
          onSortChange?.(column, newDirection);
          return newDirection;
        });
        return prevColumn;
      } else {
        // New column, start with asc
        setSortDirection("asc");
        onSortChange?.(column, "asc");
        return column;
      }
    });
  }, [onSortChange]);

  const clearSort = useCallback(() => {
    setSortColumn(null);
    setSortDirection(null);
    onSortChange?.("", null);
  }, [onSortChange]);

  const getSortDirection = useCallback((column: string): SortDirection => {
    if (sortColumn === column) {
      return sortDirection;
    }
    return null;
  }, [sortColumn, sortDirection]);

  return {
    sortColumn,
    sortDirection,
    isSorting,
    setSortColumn,
    setSortDirection,
    toggleSort,
    clearSort,
    getSortDirection,
  };
}
