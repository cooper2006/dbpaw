import { useMemo, memo } from "react";

interface VirtualTableProps<T = any> {
  data: T[];
  rowHeight: number;
  containerHeight: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  estimatedRowHeight?: number;
}

export function VirtualTable<T = any>({
  data,
  rowHeight,
  containerHeight,
  overscan = 5,
  renderRow,
}: VirtualTableProps<T>) {
  const totalHeight = data.length * rowHeight;
  
  const visibleRows = useMemo(() => {
    // Calculate which rows are visible based on scroll position
    // This is a simplified version - in production you'd track scrollTop
    const startIndex = 0;
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan * 2, data.length);
    
    return {
      startIndex,
      endIndex,
      offsetY: startIndex * rowHeight,
    };
  }, [data.length, rowHeight, containerHeight, overscan]);

  if (data.length === 0) {
    return <div>No data</div>;
  }

  return (
    <div 
      style={{ 
        height: totalHeight, 
        position: 'relative',
        contain: 'strict'
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          transform: `translateY(${visibleRows.offsetY}px)`,
          willChange: 'transform',
        }}
      >
        {data.slice(visibleRows.startIndex, visibleRows.endIndex).map((item, index) => (
          <div
            key={index}
            style={{
              height: rowHeight,
              willChange: 'contents',
            }}
          >
            {renderRow(item, visibleRows.startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for virtual scrolling with dynamic row heights
export function useVirtualScroll<T = any>(options: {
  itemCount: number;
  itemSize: number;
  viewportSize: number;
  scrollOffset: number;
  overscan?: number;
}) {
  const { itemCount, itemSize, viewportSize, scrollOffset, overscan = 5 } = options;
  
  return useMemo(() => {
    const totalSize = itemCount * itemSize;
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan);
    const visibleCount = Math.ceil(viewportSize / itemSize);
    const endIndex = Math.min(itemCount, startIndex + visibleCount + overscan * 2);
    
    return {
      virtualItems: Array.from({ length: endIndex - startIndex }, (_, i) => ({
        index: startIndex + i,
        offset: (startIndex + i) * itemSize,
        size: itemSize,
      })),
      totalSize,
      overscanStart: startIndex * itemSize,
    };
  }, [itemCount, itemSize, viewportSize, scrollOffset, overscan]);
}

// Memoized table row component for better performance
export const VirtualTableRow = memo(function VirtualTableRow({
  children,
  height,
  index,
}: {
  children: React.ReactNode;
  height: number;
  index: number;
}) {
  return (
    <div
      style={{
        height,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${index * height}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
});
