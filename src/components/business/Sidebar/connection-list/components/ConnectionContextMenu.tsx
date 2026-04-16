import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ConnectionContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  connectionName?: string;
  isConnected: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCreateDatabase: () => void;
  onRefresh: () => void;
}

export function ConnectionContextMenu({
  isOpen,
  x,
  y,
  connectionName,
  isConnected,
  onClose,
  onConnect,
  onDisconnect,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateDatabase,
  onRefresh,
}: ConnectionContextMenuProps) {
  if (!isOpen) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={onClose}>
      <DropdownMenuContent
        style={{ position: 'fixed', left: x, top: y }}
        className="w-56"
        align="start"
        side="right"
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-sm font-semibold truncate max-w-[200px]">
          {connectionName || 'Connection'}
        </div>
        <DropdownMenuSeparator />
        
        {isConnected ? (
          <DropdownMenuItem onClick={onDisconnect}>
            Disconnect
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onConnect}>
            Connect
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={onRefresh}>
          Refresh
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onEdit}>
          Edit Connection
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onDuplicate}>
          Duplicate Connection
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onCreateDatabase}>
          Create Database
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          Delete Connection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
