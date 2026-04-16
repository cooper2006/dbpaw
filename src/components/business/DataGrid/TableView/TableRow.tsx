import React from 'react';
import { TableRow as UITableRow, TableCell as UITableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface Column {
  key: string;
  width?: string | number;
}

interface TableRowProps<T extends Record<string, unknown>> {
  data: T;
  columns: Column[];
  selected: boolean;
  isEditing?: boolean;
  editColumn?: string;
  onSelect: (selected: boolean) => void;
  onCellClick?: (data: T, columnKey: string) => void;
  renderCell?: (data: T, columnKey: string) => React.ReactNode;
}

export function TableRow<T extends Record<string, unknown>>({
  data,
  columns,
  selected,
  isEditing = false,
  editColumn,
  onSelect,
  onCellClick,
  renderCell,
}: TableRowProps<T>) {
  const handleCheckboxChange = (checked: boolean) => {
    onSelect(!!checked);
  };

  const handleCellClick = (columnKey: string) => {
    if (onCellClick && !isEditing) {
      onCellClick(data, columnKey);
    }
  };

  return (
    <UITableRow 
      className={`
        ${selected ? 'bg-muted' : ''}
        ${isEditing ? 'editing-row' : ''}
      `}
      data-state={selected ? 'selected' : undefined}
    >
      <UITableCell className="w-[50px] p-3 text-center">
        <Checkbox
          checked={selected}
          onCheckedChange={handleCheckboxChange}
        />
      </UITableCell>
      {columns.map((column) => {
        const cellContent = renderCell 
          ? renderCell(data, column.key)
          : String(data[column.key] ?? '');

        return (
          <UITableCell
            key={column.key}
            className="p-3 cursor-default"
            style={{ width: column.width }}
            onClick={() => handleCellClick(column.key)}
          >
            {cellContent}
          </UITableCell>
        );
      })}
    </UITableRow>
  );
}
