import { useState, useCallback, useMemo } from "react";

interface UseTablePaginationProps {
  totalRows: number;
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface UseTablePaginationReturn {
  page: number;
  pageSize: number;
  pageInput: string;
  pageSizeInput: string;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setPageInput: (input: string) => void;
  setPageSizeInput: (input: string) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  handlePageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePageSizeInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePageInputBlur: () => void;
  handlePageSizeInputBlur: () => void;
}

export function useTablePagination({
  totalRows,
  initialPage = 1,
  initialPageSize = 100,
  onPageChange,
  onPageSizeChange,
}: UseTablePaginationProps): UseTablePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [pageSizeInput, setPageSizeInput] = useState(String(initialPageSize));

  const totalPages = useMemo(() => Math.ceil(totalRows / pageSize), [totalRows, pageSize]);
  const hasPrevPage = useMemo(() => page > 1, [page]);
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);

  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPage(validPage);
    setPageInput(String(validPage));
    onPageChange?.(validPage);
  }, [totalPages, onPageChange]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(page + 1);
    }
  }, [hasNextPage, page, goToPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      goToPage(page - 1);
    }
  }, [hasPrevPage, page, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageSizeInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageSizeInput(e.target.value);
  }, []);

  const handlePageInputBlur = useCallback(() => {
    const num = parseInt(pageInput, 10);
    if (!isNaN(num) && num > 0) {
      goToPage(num);
    } else {
      setPageInput(String(page));
    }
  }, [pageInput, page, goToPage]);

  const handlePageSizeInputBlur = useCallback(() => {
    const num = parseInt(pageSizeInput, 10);
    if (!isNaN(num) && num > 0 && num <= 1000) {
      setPageSize(num);
      setPageSizeInput(String(num));
      onPageSizeChange?.(num);
      // Reset to first page when page size changes
      goToPage(1);
    } else {
      setPageSizeInput(String(pageSize));
    }
  }, [pageSizeInput, pageSize, onPageSizeChange, goToPage]);

  return {
    page,
    pageSize,
    pageInput,
    pageSizeInput,
    totalPages,
    hasPrevPage,
    hasNextPage,
    setPage,
    setPageSize,
    setPageInput,
    setPageSizeInput,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    handlePageInputChange,
    handlePageSizeInputChange,
    handlePageInputBlur,
    handlePageSizeInputBlur,
  };
}
