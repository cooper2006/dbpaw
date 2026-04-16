import { useState, useCallback } from 'react';

interface EditorState {
  content: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
  selection?: { start: number; end: number };
  language: string;
}

export function useEditorState(initialContent = '', initialLanguage = 'sql') {
  const [state, setState] = useState<EditorState>({
    content: initialContent,
    isDirty: false,
    cursorPosition: { line: 1, column: 1 },
    language: initialLanguage,
  });

  const setContent = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      content,
      isDirty: true,
    }));
  }, []);

  const setCursorPosition = useCallback((position: { line: number; column: number }) => {
    setState(prev => ({
      ...prev,
      cursorPosition: position,
    }));
  }, []);

  const setSelection = useCallback((selection?: { start: number; end: number }) => {
    setState(prev => ({
      ...prev,
      selection,
    }));
  }, []);

  const setLanguage = useCallback((language: string) => {
    setState(prev => ({
      ...prev,
      language,
    }));
  }, []);

  const markClean = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDirty: false,
    }));
  }, []);

  const reset = useCallback((content = '', language = 'sql') => {
    setState({
      content,
      isDirty: false,
      cursorPosition: { line: 1, column: 1 },
      language,
    });
  }, []);

  const insertText = useCallback((text: string, position?: number) => {
    setState(prev => {
      const pos = position ?? prev.content.length;
      const newContent =
        prev.content.slice(0, pos) + text + prev.content.slice(pos);
      return {
        ...prev,
        content: newContent,
        isDirty: true,
      };
    });
  }, []);

  const deleteText = useCallback((start: number, end: number) => {
    setState(prev => {
      const newContent =
        prev.content.slice(0, start) + prev.content.slice(end);
      return {
        ...prev,
        content: newContent,
        isDirty: true,
      };
    });
  }, []);

  return {
    state,
    setContent,
    setCursorPosition,
    setSelection,
    setLanguage,
    markClean,
    reset,
    insertText,
    deleteText,
  };
}
