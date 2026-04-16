import React from 'react';

interface SplitPaneProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
  className?: string;
}

export const SplitPane: React.FC<SplitPaneProps> = React.memo(({
  children,
  orientation = 'horizontal',
  initialSize = 50,
  minSize = 100,
  maxSize,
  onResize,
  className = ''
}) => {
  const [isResizing, setIsResizing] = React.useState(false);
  const [size, setSize] = React.useState(initialSize);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let newSize: number;
    if (orientation === 'horizontal') {
      newSize = ((e.clientX - rect.left) / rect.width) * 100;
    } else {
      newSize = ((e.clientY - rect.top) / rect.height) * 100;
    }

    // Apply constraints
    newSize = Math.max(minSize, Math.min(maxSize || 100 - minSize, newSize));
    
    setSize(newSize);
    onResize?.(newSize);
  }, [isResizing, orientation, minSize, maxSize, onResize]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];
  const secondChild = childrenArray[1];

  return (
    <div 
      ref={containerRef}
      className={`flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} h-full w-full ${className}`}
    >
      <div 
        className={`${orientation === 'horizontal' ? 'h-full' : 'w-full'} overflow-auto`}
        style={{ 
          flex: `0 0 ${size}%`,
          minWidth: orientation === 'horizontal' ? `${minSize}px` : undefined,
          minHeight: orientation === 'vertical' ? `${minSize}px` : undefined
        }}
      >
        {firstChild}
      </div>
      
      <div
        className={`${
          orientation === 'horizontal' 
            ? 'w-1 cursor-col-resize hover:bg-primary/20' 
            : 'h-1 cursor-row-resize hover:bg-primary/20'
        } bg-border transition-colors flex-shrink-0 ${isResizing ? 'bg-primary' : ''}`}
        onMouseDown={handleMouseDown}
      />
      
      <div 
        className={`${orientation === 'horizontal' ? 'h-full' : 'w-full'} flex-1 overflow-auto`}
        style={{ 
          minWidth: orientation === 'horizontal' ? `${minSize}px` : undefined,
          minHeight: orientation === 'vertical' ? `${minSize}px` : undefined
        }}
      >
        {secondChild}
      </div>
    </div>
  );
});

SplitPane.displayName = 'SplitPane';

export default SplitPane;
