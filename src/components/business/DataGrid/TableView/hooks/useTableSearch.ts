import { useState, useCallback } from "react";

interface UseTableSearchProps {
  initialKeyword?: string;
  onSearchChange?: (keyword: string) => void;
}

interface SearchMatch {
  rowIndex: number;
  columnIndex: number;
  value: string;
}

interface UseTableSearchReturn {
  isOpen: boolean;
  keyword: string;
  matches: SearchMatch[];
  currentMatchIndex: number;
  totalMatches: number;
  
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setKeyword: (keyword: string) => void;
  setCurrentMatchIndex: (index: number) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  findMatches: (data: any[], columns: string[]) => void;
}

export function useTableSearch({
  initialKeyword = "",
  onSearchChange,
}: UseTableSearchProps = {}): UseTableSearchReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeywordState] = useState(initialKeyword);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const totalMatches = matches.length;

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setMatches([]);
    setCurrentMatchIndex(-1);
  }, []);

  const toggleSearch = useCallback(() => {
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [isOpen, closeSearch, openSearch]);

  const setKeyword = useCallback((newKeyword: string) => {
    setKeywordState(newKeyword);
    onSearchChange?.(newKeyword);
  }, [onSearchChange]);

  const findMatches = useCallback((data: any[], columns: string[]) => {
    if (!keyword.trim()) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const searchLower = keyword.toLowerCase();
    const newMatches: SearchMatch[] = [];

    data.forEach((row, rowIndex) => {
      columns.forEach((column, columnIndex) => {
        const value = row[column];
        if (value !== null && value !== undefined) {
          const valueStr = String(value).toLowerCase();
          if (valueStr.includes(searchLower)) {
            newMatches.push({
              rowIndex,
              columnIndex,
              value: String(row[column]),
            });
          }
        }
      });
    });

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [keyword]);

  const nextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
  }, [totalMatches]);

  const prevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  }, [totalMatches]);

  return {
    isOpen,
    keyword,
    matches,
    currentMatchIndex,
    totalMatches,
    openSearch,
    closeSearch,
    toggleSearch,
    setKeyword,
    setCurrentMatchIndex,
    nextMatch,
    prevMatch,
    findMatches,
  };
}
