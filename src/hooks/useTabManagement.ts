import { useState, useCallback, useMemo } from 'react';

interface Tab {
  id: string;
  title: string;
  type: string;
  data?: unknown;
}

export function useTabManagement() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const addTab = useCallback((tab: Omit<Tab, 'id'>) => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTab: Tab = { ...tab, id };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
    
    return id;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      
      // If closing active tab, activate another
      if (tabId === activeTabId) {
        const index = prev.findIndex(t => t.id === tabId);
        if (filtered.length > 0) {
          const newIndex = Math.min(index, filtered.length - 1);
          setActiveTabId(filtered[newIndex].id);
        } else {
          setActiveTabId(null);
        }
      }
      
      return filtered;
    });
  }, [activeTabId]);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const closeOtherTabs = useCallback((tabId: string) => {
    setTabs(prev => {
      const kept = prev.filter(t => t.id === tabId);
      if (kept.length > 0) {
        setActiveTabId(tabId);
      }
      return kept;
    });
  }, []);

  const closeTabsToRight = useCallback((tabId: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      if (index === -1) return prev;
      return prev.slice(0, index + 1);
    });
  }, []);

  const closeTabsToLeft = useCallback((tabId: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      if (index === -1) return prev;
      return prev.slice(index);
    });
  }, []);

  const activateTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs(prev =>
      prev.map(tab => (tab.id === tabId ? { ...tab, ...updates } : tab))
    );
  }, []);

  const activeTab = useMemo(
    () => tabs.find(t => t.id === activeTabId) || null,
    [tabs, activeTabId]
  );

  return {
    tabs,
    activeTab,
    activeTabId,
    addTab,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    closeTabsToRight,
    closeTabsToLeft,
    activateTab,
    updateTab,
  };
}
