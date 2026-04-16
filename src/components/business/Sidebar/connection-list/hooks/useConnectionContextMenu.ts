import { useState, useCallback } from 'react';
import { Connection } from '@/types';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  connection: Connection | null;
}

export function useConnectionContextMenu() {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    connection: null,
  });

  const openMenu = useCallback((connection: Connection, x: number, y: number) => {
    setMenuState({
      isOpen: true,
      x,
      y,
      connection,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      isOpen: false,
      connection: null,
    }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setMenuState(prev => ({
      ...prev,
      x,
      y,
    }));
  }, []);

  return {
    menuState,
    openMenu,
    closeMenu,
    updatePosition,
  };
}
