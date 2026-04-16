import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, shiftKey, altKey, metaKey } = event;

      for (const shortcut of shortcuts) {
        const matches =
          key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrl === undefined || shortcut.ctrl === ctrlKey) &&
          (shortcut.shift === undefined || shortcut.shift === shiftKey) &&
          (shortcut.alt === undefined || shortcut.alt === altKey) &&
          (shortcut.meta === undefined || shortcut.meta === metaKey);

        if (matches) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const registerShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      // This would typically update a state, but for simplicity we just log
      console.log('Registered shortcut:', shortcut);
    },
    []
  );

  const unregisterShortcut = useCallback((key: string) => {
    console.log('Unregistered shortcut:', key);
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
  };
}

// Common shortcuts factory
export function createCommonShortcuts(actions: {
  onSave?: () => void;
  onNewQuery?: () => void;
  onCloseTab?: () => void;
  onFind?: () => void;
  onRunQuery?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      action: actions.onSave,
      description: 'Save',
    });
  }

  if (actions.onNewQuery) {
    shortcuts.push({
      key: 't',
      ctrl: true,
      action: actions.onNewQuery,
      description: 'New Query',
    });
  }

  if (actions.onCloseTab) {
    shortcuts.push({
      key: 'w',
      ctrl: true,
      action: actions.onCloseTab,
      description: 'Close Tab',
    });
  }

  if (actions.onFind) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      action: actions.onFind,
      description: 'Find',
    });
  }

  if (actions.onRunQuery) {
    shortcuts.push({
      key: 'Enter',
      ctrl: true,
      action: actions.onRunQuery,
      description: 'Run Query',
    });
  }

  return shortcuts;
}
