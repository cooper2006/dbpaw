import React, { useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface EditorPanelProps {
  editorContent: React.ReactNode;
  resultContent?: React.ReactNode;
  editorSize?: number;
  resultSize?: number;
  onResize?: (sizes: { editor: number; result: number }) => void;
}

export function EditorPanel({
  editorContent,
  resultContent,
  editorSize = 50,
  resultSize = 50,
  onResize,
}: EditorPanelProps) {
  const handleLayout = useCallback((sizes: number[]) => {
    if (onResize) {
      onResize({
        editor: sizes[0],
        result: sizes[1],
      });
    }
  }, [onResize]);

  return (
    <ResizablePanelGroup direction="vertical" className="flex-1">
      <ResizablePanel 
        defaultSize={editorSize} 
        minSize={20}
        onResize={(size) => handleLayout([size, 100 - size])}
      >
        <div className="h-full overflow-auto">
          {editorContent}
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel 
        defaultSize={resultSize} 
        minSize={20}
        onResize={(size) => handleLayout([100 - size, size])}
      >
        <div className="h-full overflow-auto">
          {resultContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
