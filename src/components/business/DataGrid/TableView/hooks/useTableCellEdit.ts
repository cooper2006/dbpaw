import { useState, useCallback, useMemo } from 'react';

interface UseTableCellEditOptions<T extends Record<string, unknown>> {
  data: T[];
  onUpdate: (rowIndex: number, columnKey: string, value: unknown) => Promise<void> | void;
}

export function useTableCellEdit<T extends Record<string, unknown>>({
  data,
  onUpdate,
}: UseTableCellEditOptions<T>) {
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnKey: string;
    value: unknown;
  } | null>(null);

  const startEdit = useCallback((rowIndex: number, columnKey: string, currentValue: unknown) => {
    setEditingCell({
      rowIndex,
      columnKey,
      value: currentValue,
    });
  }, []);

  const updateValue = useCallback((value: unknown) => {
    setEditingCell(prev => prev ? { ...prev, value } : null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingCell) return;

    try {
      await onUpdate(editingCell.rowIndex, editingCell.columnKey, editingCell.value);
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to save cell edit:', error);
    }
  }, [editingCell, onUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const isEditing = useCallback(
    (rowIndex: number, columnKey: string) => {
      return editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey;
    },
    [editingCell]
  );

  return {
    editingCell,
    isEditing,
    startEdit,
    updateValue,
    saveEdit,
    cancelEdit,
  };
}
