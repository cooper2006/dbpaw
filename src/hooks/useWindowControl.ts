import { useState, useCallback } from 'react';

interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
}

export function useWindowControl() {
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isMinimized: false,
    isFullScreen: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    x: 0,
    y: 0,
  });

  const maximize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowState(prev => ({
        ...prev,
        isMaximized: true,
        isMinimized: false,
        width: window.screen.width,
        height: window.screen.height,
        x: 0,
        y: 0,
      }));
    }
  }, []);

  const minimize = useCallback(() => {
    setWindowState(prev => ({
      ...prev,
      isMinimized: true,
    }));
  }, []);

  const restore = useCallback(() => {
    setWindowState(prev => ({
      ...prev,
      isMaximized: false,
      isMinimized: false,
    }));
  }, []);

  const toggleMaximize = useCallback(() => {
    setWindowState(prev => {
      if (prev.isMaximized) {
        return { ...prev, isMaximized: false };
      }
      if (typeof window !== 'undefined') {
        return {
          ...prev,
          isMaximized: true,
          width: window.screen.width,
          height: window.screen.height,
          x: 0,
          y: 0,
        };
      }
      return prev;
    });
  }, []);

  const enterFullScreen = useCallback(() => {
    setWindowState(prev => ({
      ...prev,
      isFullScreen: true,
    }));
  }, []);

  const exitFullScreen = useCallback(() => {
    setWindowState(prev => ({
      ...prev,
      isFullScreen: false,
    }));
  }, []);

  const toggleFullScreen = useCallback(() => {
    setWindowState(prev => ({
      ...prev,
      isFullScreen: !prev.isFullScreen,
    }));
  }, []);

  const resize = useCallback((width: number, height: number) => {
    setWindowState(prev => ({
      ...prev,
      width,
      height,
      isMaximized: false,
    }));
  }, []);

  const move = useCallback((x: number, y: number) => {
    setWindowState(prev => ({
      ...prev,
      x,
      y,
      isMaximized: false,
    }));
  }, []);

  return {
    windowState,
    maximize,
    minimize,
    restore,
    toggleMaximize,
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen,
    resize,
    move,
  };
}
