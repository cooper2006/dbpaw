import React, { useState, useCallback, useMemo } from 'react';
import { TableHeader as UITableHeader } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
}

interface TableHeaderProps {
  columns: Column[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  allSelected: boolean;
  someSelected: boolean;
  onSort: (columnKey: string) => void;
  onSelectAll: (selected: boolean) => void;
}

export function TableHeader({
  columns,
  sortColumn,
  sortDirection,
  allSelected,
  someSelected,
  onSort,
  onSelectAll,
}: TableHeaderProps) {
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <UITableHeader>
      <tr>
        <th className="w-[50px] p-3 text-center">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={onSelectAll}
          />
        </th>
        {columns.map((column) => (
          <th
            key={column.key}
            className="p-3 text-left font-medium text-muted-foreground"
            style={{ width: column.width }}
          >
            {column.sortable ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent"
                onClick={() => onSort(column.key)}
              >
                {column.label}
                {getSortIcon(column.key)}
              </Button>
            ) : (
              column.label
            )}
          </th>
        ))}
      </tr>
    </UITableHeader>
  );
}
