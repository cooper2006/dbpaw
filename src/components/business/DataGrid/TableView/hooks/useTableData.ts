import { useState, useCallback, useMemo } from "react";
import type { ColumnInfo, TransferFormat } from "@/services/api";

interface PendingChange {
  rowIndex: number;
  sourceRowIndex: number;
  column: string;
  oldValue: any;
  newValue: any;
}

interface InsertDraftRow {
  id: string;
  values: Record<string, any>;
}

interface UseTableDataProps {
  connectionId: string;
  database: string;
  table: string;
  schema?: string;
  initialPageSize?: number;
  initialPage?: number;
}

interface UseTableDataReturn {
  // State
  page: number;
  pageSize: number;
  whereInput: string;
  orderByInput: string;
  pageInput: string;
  pageSizeInput: string;
  
  // Data
  data: any[];
  totalRows: number;
  columns: string[];
  tableColumns: ColumnInfo[];
  primaryKeys: string[];
  columnComments: Record<string, string>;
  clickhouseEngine: string | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isExporting: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setWhereInput: (where: string) => void;
  setOrderByInput: (orderBy: string) => void;
  refreshData: () => Promise<void>;
  exportData: (format: TransferFormat) => Promise<void>;
  
  // Computed
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export function useTableData({
  connectionId,
  database,
  table,
  schema,
  initialPageSize = 100,
  initialPage = 1,
}: UseTableDataProps): UseTableDataReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [whereInput, setWhereInput] = useState("");
  const [orderByInput, setOrderByInput] = useState("");
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [pageSizeInput, setPageSizeInput] = useState(String(initialPageSize));
  
  const [data, setData] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);
  const [columnComments, setColumnComments] = useState<Record<string, string>>({});
  const [clickhouseEngine, setClickhouseEngine] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = useMemo(() => Math.ceil(totalRows / pageSize), [totalRows, pageSize]);
  const hasPrevPage = useMemo(() => page > 1, [page]);
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to fetch data
      console.log("Fetching data for", { connectionId, database, table, schema, page, pageSize });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [connectionId, database, table, schema, page, pageSize]);

  const exportData = useCallback(async (format: TransferFormat) => {
    setIsExporting(true);
    try {
      // TODO: Implement API call to export data
      console.log("Exporting data in format:", format);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    page,
    pageSize,
    whereInput,
    orderByInput,
    pageInput,
    pageSizeInput,
    data,
    totalRows,
    columns,
    tableColumns,
    primaryKeys,
    columnComments,
    clickhouseEngine,
    isLoading,
    isSaving,
    isExporting,
    isRefreshing,
    isDeleting,
    setPage,
    setPageSize,
    setWhereInput,
    setOrderByInput,
    refreshData,
    exportData,
    totalPages,
    hasPrevPage,
    hasNextPage,
  };
}
