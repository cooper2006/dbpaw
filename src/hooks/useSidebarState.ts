import { useState, useCallback } from 'react';

interface SidebarState {
  isOpen: boolean;
  activeSection: string;
  collapsedSections: Set<string>;
  width: number;
}

export function useSidebarState(initialWidth = 280) {
  const [state, setState] = useState<SidebarState>({
    isOpen: true,
    activeSection: 'connections',
    collapsedSections: new Set(),
    width: initialWidth,
  });

  const toggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  const open = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
    }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const setActiveSection = useCallback((section: string) => {
    setState(prev => ({
      ...prev,
      activeSection: section,
    }));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setState(prev => {
      const collapsed = new Set(prev.collapsedSections);
      if (collapsed.has(section)) {
        collapsed.delete(section);
      } else {
        collapsed.add(section);
      }
      return {
        ...prev,
        collapsedSections: collapsed,
      };
    });
  }, []);

  const collapseSection = useCallback((section: string) => {
    setState(prev => {
      const collapsed = new Set(prev.collapsedSections);
      collapsed.add(section);
      return {
        ...prev,
        collapsedSections: collapsed,
      };
    });
  }, []);

  const expandSection = useCallback((section: string) => {
    setState(prev => {
      const collapsed = new Set(prev.collapsedSections);
      collapsed.delete(section);
      return {
        ...prev,
        collapsedSections: collapsed,
      };
    });
  }, []);

  const isSectionCollapsed = useCallback(
    (section: string) => {
      return state.collapsedSections.has(section);
    },
    [state.collapsedSections]
  );

  const resize = useCallback((width: number) => {
    setState(prev => ({
      ...prev,
      width: Math.max(200, Math.min(500, width)),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isOpen: true,
      activeSection: 'connections',
      collapsedSections: new Set(),
      width: initialWidth,
    });
  }, [initialWidth]);

  return {
    state,
    toggle,
    open,
    close,
    setActiveSection,
    toggleSection,
    collapseSection,
    expandSection,
    isSectionCollapsed,
    resize,
    reset,
  };
}
