import { useState, useCallback, useMemo } from 'react';

export function useTableSelection<T extends Record<string, unknown>>(data: T[]) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const selectRow = useCallback((rowIndex: number, selected: boolean) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(rowIndex);
      } else {
        next.delete(rowIndex);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(data.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  }, [data]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const isRowSelected = useCallback(
    (rowIndex: number) => {
      return selectedRows.has(rowIndex);
    },
    [selectedRows]
  );

  const selectedData = useMemo(() => {
    return Array.from(selectedRows).map(index => data[index]);
  }, [data, selectedRows]);

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return {
    selectedRows,
    selectedData,
    allSelected,
    someSelected,
    selectRow,
    selectAll,
    clearSelection,
    isRowSelected,
  };
}
