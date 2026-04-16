import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useWindowControl } from '@/hooks/useWindowControl';

interface WindowTitleProps {
  title?: string;
  showConnectionInfo?: boolean;
  connectionName?: string;
  databaseName?: string;
}

export const WindowTitle: React.FC<WindowTitleProps> = React.memo(({
  title = 'DBPaw',
  showConnectionInfo = false,
  connectionName,
  databaseName
}) => {
  const { isModified } = useWindowControl();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg">{title}</span>
        {isModified && (
          <Badge variant="secondary" className="text-xs">
            未保存
          </Badge>
        )}
      </div>
      
      {showConnectionInfo && (connectionName || databaseName) && (
        <div className="flex items-center gap-2 ml-4 text-sm text-muted-foreground">
          <span>|</span>
          {connectionName && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {connectionName}
            </span>
          )}
          {databaseName && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {databaseName}
            </span>
          )}
        </div>
      )}
      
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          v1.0.0
        </Badge>
      </div>
    </div>
  );
});

WindowTitle.displayName = 'WindowTitle';

export default WindowTitle;
