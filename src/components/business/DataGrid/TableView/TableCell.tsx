import { memo, useMemo, useCallback } from "react";

interface TableCellProps {
  rowIndex: number;
  column: string;
  colIndex: number;
  value: any;
  displayValue: string | null;
  isEditing: boolean;
  isSelected: boolean;
  isRowSelected: boolean;
  isMatched: boolean;
  isActiveSearchMatch: boolean;
  isModified: boolean;
  isEditable: boolean;
  width: number;
  onCellClick: (rowIndex: number, column: string) => void;
  onCellDoubleClick: (rowIndex: number, column: string, value: any) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onEditBlur: () => void;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onOpenComplexViewer: (value: any, columnName: string) => void;
  isComplex: boolean;
}

export const TableCell = memo(function TableCell({
  rowIndex,
  column,
  colIndex,
  value,
  displayValue,
  isEditing,
  isSelected,
  isRowSelected,
  isMatched,
  isActiveSearchMatch,
  isModified,
  isEditable,
  width,
  onCellClick,
  onCellDoubleClick,
  onEditKeyDown,
  onEditBlur,
  editValue,
  onEditValueChange,
  onOpenComplexViewer,
  isComplex,
}: TableCellProps) {
  const className = useMemo(() => {
    const classes = [
      "px-0 py-0 text-sm text-foreground font-mono border-r border-border relative group transition-all duration-150 ease-out",
    ];
    
    if (isSelected && !isEditing) classes.push("bg-accent text-accent-foreground");
    if (isRowSelected && !isSelected && !isEditing) classes.push("bg-accent/60");
    if (isMatched && !isEditing) classes.push("bg-amber-100/60 dark:bg-amber-900/20");
    if (isActiveSearchMatch && !isEditing) classes.push("border-b-2 border-b-amber-500/70");
    if (isModified && !isEditing) classes.push("border-l-2 border-l-orange-400");
    if (isEditable) classes.push("cursor-pointer");
    
    return classes.join(" ");
  }, [isSelected, isRowSelected, isMatched, isActiveSearchMatch, isModified, isEditable, isEditing]);

  const handleComplexViewerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenComplexViewer(displayValue, column);
  }, [displayValue, column, onOpenComplexViewer]);

  return (
    <td
      data-row-index={rowIndex}
      data-col-index={colIndex}
      className={className}
      style={{ width, minWidth: 50 }}
      onClick={() => onCellClick(rowIndex, column)}
      onDoubleClick={() => onCellDoubleClick(rowIndex, column, value)}
    >
      {isEditing ? (
        <input
          type="text"
          autoCapitalize="none"
          className="w-full h-full px-4 py-2 bg-background border-2 border-primary outline-none font-mono text-sm shadow-[0_0_0_3px_rgba(var(--primary)_0.15)] animate-in fade-in zoom-in-95 duration-150"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={onEditBlur}
        />
      ) : (
        <div className="px-4 py-2 truncate">
          {displayValue !== null && displayValue !== undefined ? (
            <span className={isModified ? "text-orange-600 dark:text-orange-400" : ""}>
              {displayValue}
            </span>
          ) : (
            <span className="text-muted-foreground italic">NULL</span>
          )}
          {isComplex && (
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground bg-background/80 rounded px-0.5 transition-opacity"
              title="View structured data"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleComplexViewerClick}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.column === nextProps.column &&
    prevProps.displayValue === nextProps.displayValue &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isRowSelected === nextProps.isRowSelected &&
    prevProps.isMatched === nextProps.isMatched &&
    prevProps.isActiveSearchMatch === nextProps.isActiveSearchMatch &&
    prevProps.isModified === nextProps.isModified &&
    prevProps.editValue === nextProps.editValue &&
    prevProps.width === nextProps.width
  );
});

interface TableRowProps {
  rowIndex: number;
  startIndex: number;
  row: Record<string, any>;
  columns: string[];
  editingCell: { row: number; col: string } | null;
  selectedCell: { row: number; col: string } | null;
  selectedRows: Set<number>;
  matchedCellKeys: Set<string>;
  currentSearchMatch: { row: number; col: string } | null;
  pendingChanges: Map<string, any>;
  columnWidths: Record<string, number>;
  isEditableForUpdates: boolean;
  getCellDisplayValue: (rowIndex: number, column: string, value: any) => string | null;
  isCellModified: (rowIndex: number, column: string) => boolean;
  onCellClick: (rowIndex: number, column: string) => void;
  onCellDoubleClick: (rowIndex: number, column: string, value: any) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onEditBlur: () => void;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onOpenComplexViewer: (value: any, columnName: string) => void;
  isComplexValue: (value: any) => boolean;
}

export const TableRow = memo(function TableRow({
  rowIndex,
  startIndex,
  row,
  columns,
  editingCell,
  selectedCell,
  selectedRows,
  matchedCellKeys,
  currentSearchMatch,
  pendingChanges,
  columnWidths,
  isEditableForUpdates,
  getCellDisplayValue,
  isCellModified,
  onCellClick,
  onCellDoubleClick,
  onEditKeyDown,
  onEditBlur,
  editValue,
  onEditValueChange,
  onOpenComplexViewer,
  isComplexValue,
}: TableRowProps) {
  const isRowSelected = useMemo(() => selectedRows.has(rowIndex), [selectedRows, rowIndex]);

  const cells = useMemo(() => {
    return columns.map((column, colIndex) => {
      const modified = isCellModified(rowIndex, column);
      const displayValue = getCellDisplayValue(rowIndex, column, row[column]);
      const isEditing = editingCell?.row === rowIndex && editingCell?.col === column;
      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === column;
      const matched = matchedCellKeys.has(`${rowIndex}::${column}`);
      const isActiveSearchMatch = 
        !!currentSearchMatch && 
        currentSearchMatch.row === rowIndex && 
        currentSearchMatch.col === column;
      const isComplex = isComplexValue(displayValue);
      const width = columnWidths[column] || 'auto';

      return (
        <TableCell
          key={column}
          rowIndex={rowIndex}
          column={column}
          colIndex={colIndex}
          value={row[column]}
          displayValue={displayValue}
          isEditing={isEditing}
          isSelected={isSelected}
          isRowSelected={isRowSelected}
          isMatched={matched}
          isActiveSearchMatch={isActiveSearchMatch}
          isModified={modified}
          isEditable={isEditableForUpdates}
          width={typeof width === 'number' ? width : 100}
          onCellClick={onCellClick}
          onCellDoubleClick={onCellDoubleClick}
          onEditKeyDown={onEditKeyDown}
          onEditBlur={onEditBlur}
          editValue={editValue}
          onEditValueChange={onEditValueChange}
          onOpenComplexViewer={onOpenComplexViewer}
          isComplex={isComplex}
        />
      );
    });
  }, [
    columns,
    rowIndex,
    row,
    editingCell,
    selectedCell,
    selectedRows,
    matchedCellKeys,
    currentSearchMatch,
    pendingChanges,
    columnWidths,
    isEditableForUpdates,
    getCellDisplayValue,
    isCellModified,
    onCellClick,
    onCellDoubleClick,
    onEditKeyDown,
    onEditBlur,
    editValue,
    onEditValueChange,
    onOpenComplexViewer,
    isComplexValue,
    isRowSelected,
  ]);

  return (
    <tr className="hover:bg-muted/50 border-b border-border group">
      <td
        className={[
          "px-4 py-2 text-xs text-muted-foreground border-r border-border cursor-pointer select-none",
          isRowSelected ? "bg-accent text-accent-foreground" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {startIndex + rowIndex + 1}
      </td>
      {cells}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Shallow comparison for performance
  return (
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.startIndex === nextProps.startIndex &&
    prevProps.columns === nextProps.columns &&
    prevProps.editingCell === nextProps.editingCell &&
    prevProps.selectedCell === nextProps.selectedCell &&
    prevProps.isRowSelected === nextProps.isRowSelected &&
    prevProps.editValue === nextProps.editValue
  );
});
